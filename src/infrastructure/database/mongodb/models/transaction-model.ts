import MongoDb from '../mongodb'
import TransactionSchema from '../schemas/transaction-schema'

const connection = MongoDb.getOrCreateConnection()

const Transaction = connection.model('transaction', TransactionSchema, 'transactions')

class TransactionModel{
    static getTransactionById(transactionId: string){
        return Transaction.findById(transactionId).exec()
    }

    static updateStatusById(transactionId: string, status: string, statusMessage?: string){
        return Transaction.updateOne({_id: transactionId}, { status, statusMessage })
    }
}

export default TransactionModel