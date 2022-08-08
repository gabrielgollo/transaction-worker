import { hostname } from 'os';

const { INFLUX_HOST='', INFLUX_TOKEN='', INFLUX_ORG='', INFLUX_BUCKET='', APP_NAME=''} = process.env;
console.log(INFLUX_HOST, INFLUX_TOKEN)
//Creates a writer with "seconds" as precision

import {InfluxDB, Point} from '@influxdata/influxdb-client'
import { getLogger } from 'log4js';

const logger = getLogger('Metrics Service')
const influxDB = new InfluxDB({url: INFLUX_HOST, token: INFLUX_TOKEN})
const writeApi = influxDB.getWriteApi(INFLUX_ORG, INFLUX_BUCKET)


writeApi.useDefaultTags({location: hostname(), app: APP_NAME})

export default class MetricsService{
    static saveLatency(latency: number){
        try{
            const point1 = new Point('latency')
            .tag('APP_NAME', APP_NAME)
            .floatField('value', latency)
            
            
            writeApi.writePoint(point1)
            
            logger.info('Metrics Sent!')
        } catch (error: any) {
            logger.error(error.message)
        }

    }
}