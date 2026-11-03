import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { listnerQueryService } from '../queries/pnotif-queries';
import { broker_device_msg, CODE, generateResponse } from '../enums/mqtt-msg.enum';
import { LoadSecretsService } from '../../../load-secret/load-secret.service';
import { transform } from '../utils/transformer';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TokenService } from '../token/token.services';
import { generate } from 'rxjs';


@Injectable()
export class MqttMsgLogService {
    private readonly logger = new Logger(MqttMsgLogService.name);

    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private qs: listnerQueryService,
        private ls: LoadSecretsService,
        private http: HttpService,
        private ts: TokenService
    ) { }

    async processMessage(topic: string, payloadStr: string) {
        try {
            const payload = JSON.parse(payloadStr);
            const metricsConfig: any = this.ls.metricConfig['listener_config'];
            const imei = await this.extractIMEI(topic);
            const matchingConfig = await this.findMatchingConfig(topic, metricsConfig);
            if (!matchingConfig) {
                this.logger.log(`❌ No matching config found for topic: ${topic}`);
                return;
            }
            const transformedPayload = await transform(payload, matchingConfig['transformer']);
            
            if (matchingConfig['isRupeeConversionNeeded'] && transformedPayload?.data?.money) {
                transformedPayload.data.money = transformedPayload.data.money / 100;
                this.logger.log(`💰 Converted money to rupees for Walnut: ₹${transformedPayload.data.money}`);
            }
            const result = await this[matchingConfig['fnName']](imei, transformedPayload?.data); 
            console.log("The result is:::", result);
        } catch (error) {
            this.logger.error(`❌ Error processing message: ${error.message}`);
        }
    }

    /**
     * Find the matching topic configuration in dynamically loaded metricConfig
     */
    findMatchingConfig(topic: string, metricsConfig: any) {
        for (const [pattern, config] of Object.entries(metricsConfig)) {
            if (this.matchTopic(topic, pattern)) {
                return config;
            }
        }
        return null;
    }

    /**
     * Convert MQTT wildcards (* and <imei>) to regex and check match
     */
    matchTopic(topic: string, pattern: string): boolean {
        const regexPattern = pattern
            .replace(/\*/g, '([^/]+)')  // Replace * with regex capturing group
            .replace(/<imei>/g, '([^/]+)'); // Replace <imei> with capturing group

        return new RegExp(`^${regexPattern}$`).test(topic);
    }

    /**
     * Extract IMEI or device identifier from topic
     */
    async extractIMEI(topic: string) {
        const pattern = Object.keys(this.ls.metricConfig['listener_config']).find(p => this.matchTopic(topic, p));
        console.log("The pattern is:::", pattern);
        if (!pattern) return 'unknown';
        const topicParts = topic.split('/');
        const patternParts = pattern.split('/');
        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i] === '*' || patternParts[i] === '<imei>') {
                return topicParts[i]; // Return IMEI/device ID when * or <imei> is found
            }
        }

        return 'unknown';
    }

   
    async insertTxnLog(imei: string, transformedPayload: any) {

        this.logger.log('Starting insertion of payment 💰💰💰')
        const { rrn, money } = transformedPayload;

        if (typeof rrn === 'string' && rrn.startsWith('Simulate')) {
            this.logger.log(`skipping transaction log for IMEI: ${imei} with RRN: ${rrn}`);
            return;
        }

        const query = await this.qs.insertMsgIntoPlog('plog');
        const result = await this.pool.query(query, [rrn, imei, money, broker_device_msg.RECEIVED_MSG_FROM_BROKER]);

            //   /// Fetch bid and brid from a DB query
       const queryStr = await this.qs.getIdFromIMEI(); // implement this

       const resultvalues = await this.pool.query(queryStr, [imei]);
       if (resultvalues?.rowCount === 0) {
           this.logger.log(`❌ No ids found for IMEI: ${imei}`);
           return;
       }
       const bid = resultvalues.rows[0].bid; // Assuming bid is in the first row
       const brid = resultvalues.rows[0].brid; // Assuming brid is in the first row


        const url = `${process.env.AXIOS_URL}/intel/payments/aggregate`;
        const token = await this.ts.getToken(); // Assuming you get token like this
      
       const headers = {
         "Content-Type": "application/json",
         "Authorization": `Bearer ${token}`
       };
      
       const requestPayload = {
         event: "PAYMENT_PROCESSED",
         rdetails: {
           headers: ["row_id", "status", "msg", "bid", "brid", "amt", "imei"],
           values: [[1, 1, "success", bid, brid, money, imei]],
           status: [1, 1, 0]
         }
       };

      
       const intelResult = await firstValueFrom(
        this.http.post(url, requestPayload, { headers })
      );
      
       if (intelResult.status === 201) {
         this.logger.log(`✅ Intel result inserted for IMEI: ${imei}`);
       } else {
         this.logger.log(`⚠️ No rows affected for intel result`);
       }

        if (result?.rowCount > 0) {
            this.logMsgIntoBlog(rrn, money, imei, broker_device_msg.RECEIVED_MSG_FROM_BROKER);
            this.logger.log(`✅ Transaction log inserted for IMEI: ${imei}`);
            
            return result.rows[0];
        } else {
            this.logger.log(`⚠️ No rows affected for transaction log`);
        }
    }

    /**
     * Function to update transaction log status
     */
    async updateTxnLog(imei: string, transformedPayload: any) {
        const { rrn, status } = transformedPayload;

        if (typeof rrn === 'string' && rrn.startsWith('Simulate')) {
            this.logger.log(`skipping transaction log for IMEI: ${imei} with RRN: ${rrn}`);
            return;
        }
        
        const query = await this.qs.updateAckStatus();
        const result = await this.pool.query(query, [broker_device_msg.RECEIVED_ACK_FROM_DEVICE, status, rrn]);

        if (result?.rowCount > 0) {
            this.logger.log(`✅ Transaction status updated for IMEI: ${imei}`);
        } else {
            this.logger.log(`⚠️ No rows affected for transaction update`);
        }
    }

    /**
     * Function to insert metrics into DB
     */
    async insertMetrics(imei: string, transformedPayload: any) {
        const query = await this.qs.insertMetricsIntoDB();
        const result = await this.pool.query(query, [imei, transformedPayload]);
        if (result?.rowCount > 0) {
            this.logger.log(`✅ Metrics inserted for IMEI: ${imei}`);
        } else {
            this.logger.log(`⚠️ No rows affected for metrics insertion`);
        }
    }

    async logMsgIntoBlog(rrn: string, txnAmt: number, imei: string, status) {
        try {
            const query = await this.qs.insertMsgIntoPlog('blog');
            const result = await this.pool.query(query, [rrn, imei, txnAmt, status]); 
            if(result?. rowCount > 0 ) {
                this.logger.log(`✅ Message logged into blog for IMEI: ${imei}`);
                return generateResponse(200, CODE.SUCCESS, { rrn, txnAmt });
            }else{
                this.logger.log(`⚠️ No rows affected for message log into blog`);
                return generateResponse(200, CODE.INVALID, `Failed to log message into blog`);
            } 
        } catch (error) {
            this.logger.error(`❌ Error logging message into blog: ${error.message}`);
            return generateResponse(500, CODE.ERROR, `Failed to log message into blog`, { error: error.message });
            
        }
        
    }
}


