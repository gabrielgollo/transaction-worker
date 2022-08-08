import dotenv from 'dotenv';
dotenv.config({path: './.env'});

import log4jsConfig from './src/configs/log4js.json' 
import log4js from 'log4js';
log4js.configure(log4jsConfig);

const logger = log4js.getLogger('App');

import { QueueService } from "./src/infrastructure/queue/rabbitmq-service";
import AppController from './src/controller/app-controller';


logger.info('Worker has been initialized!')
const processMsg = async (transactionId: string) => {
  try {
    const startTime = new Date()
    logger.info(`${new Date()}-- Received message --`);
  

    const controllerResponse = await AppController.processMessage(transactionId, startTime);
    
    return controllerResponse;
  } catch (error) {
    logger.error(error)
  }

  return {
    status: 'fail',
    message: 'Error processing message'
  }
}


QueueService.startConsuming(processMsg);