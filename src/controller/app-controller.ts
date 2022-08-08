import { getLogger } from 'log4js'
import FundService from '../services/fund-service'
import MetricsService from '../services/metrics-service'
const logger = getLogger('App Controller')
export default class AppController{
    static async processMessage(transactionId: string, startTime: Date){

        try {
            const response = await FundService.processMessage(transactionId)
            logger.info('Ending App Controller..')
            MetricsService.saveLatency(new Date().getTime() - startTime.getTime(), 'Confirmed')
            return response
        } catch (error: any) {
            if(error.shoudlAck === 'failure') logger.warn('This message needs a retry!')
            MetricsService.saveLatency(new Date().getTime() - startTime.getTime(), error.message)
            return {
                status: error.shoudlAck
            }
        }


        
    }
}