import { getLogger } from 'log4js'
import FundService from '../services/fund-service'
const logger = getLogger('App Controller')
export default class AppController{
    static async processMessage(transactionId: string){

        try {
            const response = await FundService.processMessage(transactionId)
            logger.info('Ending App Controller..')
            return response
        } catch (error: any) {
            return {
                status: error.shoudlAck
            }
        }


        
    }
}