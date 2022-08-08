import { getLogger } from "log4js";
import AccountAPI from "../api/AccountAPI";
import { QueueService } from "../infrastructure/queue/rabbitmq-service";
import TransactionModel from "../infrastructure/database/mongodb/models/transaction-model";
import { Exception } from "../helpers/exception";
import { TransactionsInterface } from "../entities/transactions";
const logger = getLogger('Fund Service')

const { AMQP_DISCARD_QUEUE= 'discard-transactionsid-queue', AMQP_RETRY_PAYMENT_QUEUE= 'retry-payment-queue' } = process.env

export default class FundService{
    public static async processMessage(transactionId: string){

        const TransactionToProcess = await TransactionModel.getTransactionById(transactionId)

        if(!TransactionToProcess) {
            await QueueService.sendToQueue(AMQP_DISCARD_QUEUE, transactionId)
            logger.error('Transação não encontrada!')
            return {
                message: 'Falha ao obter transação',
                status: 'success'
            }
        }

        const {
            accountOrigin, 
            accountDestination,
            value
        } = TransactionToProcess

        TransactionModel.updateStatusById(transactionId, 'Processing')

        const { isAccountValid, message: messageFromValidation  } = await FundService.getAccountsAndCheckIfIsValid(TransactionToProcess)
        if(!isAccountValid) throw new Exception(messageFromValidation, 500, 'failure')

        const { hasDebitBeenRealized, message: messageFromRequestDebit } = await FundService.requestDebit(accountOrigin, value)
        if(!hasDebitBeenRealized) {
            TransactionModel.updateStatusById(transactionId, 'Error', messageFromRequestDebit)
            throw new Exception(messageFromRequestDebit, 500, 'failure')
        } 

        const { hasCreditBeenAdded } = await FundService.requestCredit(accountDestination, value)
        if(!hasCreditBeenAdded) {
            TransactionModel.updateStatusById(transactionId, 'Retrying Processing Payment')
            const retryPaymentInfo = {
                accountDestination,
                value
            }
            await QueueService.sendToQueue(AMQP_RETRY_PAYMENT_QUEUE, JSON.stringify(retryPaymentInfo))
        } else {
            
            TransactionModel.updateStatusById(transactionId, 'Confirmed')

        }
        

        return { status: 'success' }
    }

    
    
    
    private static async getAccountsAndCheckIfIsValid(transaction: TransactionsInterface){
        const {
            _id: transactionId,
            accountOrigin, 
            accountDestination,
            value
        } = transaction

        try {
            let response1: any = null;
            let response2: any = null;
            try {
                const responses = await Promise.allSettled([
                    AccountAPI.get(`/Account/${accountOrigin}`),
                    AccountAPI.get(`/Account/${accountDestination}`)
                ])
                response1 = responses[0];
                response2 = responses[1];
            } catch(error) {
                logger.warn('Error while handling request to /Account/')
            }
            
            if(response1.status===500) throw new Exception('Failed to get origin account', 500, 'failure')
            if(response2.status===500) throw new Exception('Failed to get destination account', 500, 'failure')

            if(response1.status !==200) throw new Exception('Invalid account origin number', 400, 'success')
            if(response2.status !==200) throw new Exception('Invalid account destination number', 400, 'success')


            FundService.validateIfOriginBalanceHasValue(response1.data.balance, value)

            return {
                isAccountValid: true,
                message: "Success!",
                accountData: {
                    accoutOriginData: response1.data,
                    accountDestinationData: response2.data
                }
            }
        } catch (error: any) {
            if(error.shoudlAck === 'failure') {
                return {
                    isAccountValid: false,
                    message: error.message,
                    accountData: {}
                }
            } else if (error.shoudlAck === 'success') {
                TransactionModel.updateStatusById(transactionId, 'Error', error.message)
            }

            throw new Exception(error.message, error.statusCode, 'success')
        }
    }

    private static validateIfOriginBalanceHasValue(accountOriginBalance: number, value: number){
        if(accountOriginBalance < value) throw new Exception("Account Origin has insufficient balance", 400)
    }

    private static async requestDebit(accountOrigin: string, value: number) {
            try {
                await AccountAPI.post('/Account', {
                    accountNumber: accountOrigin,
                    value: value,
                    type: 'Debit'
                })
    
                return {
                    hasDebitBeenRealized:true,
                    message: "Success!",
                    status: 200
                }
            } catch (error: any) {
                logger.error('Failed to do debit from Origin Account')
                if(error.status===400) return {
                    hasDebitBeenRealized: false,
                    message: "Not enough balance",
                    status: 400
                }
                throw new Exception(error.message, error.status, error.status===400 ? 'success' : 'failure')
            }
        
    }

    private static async requestCredit(accountDestination: string, value: number) {
        try {
            await AccountAPI.post('/Account', {
                accountNumber: accountDestination,
                value: value,
                type: 'Credit'
            })

            return {
                hasCreditBeenAdded:true,
                message: "Success!",
                status: 200
            }
        } catch (error: any) {
            logger.error('Failed to add credit to destination Account!')
            return {
                hasCreditBeenAdded: false,
                message: "Not enough balance",
                status: 400
            }
        }
    
}
}