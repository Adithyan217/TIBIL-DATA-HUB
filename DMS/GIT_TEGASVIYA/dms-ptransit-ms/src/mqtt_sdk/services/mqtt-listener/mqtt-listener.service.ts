import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { listnerQueryService } from '../queries/pnotif-queries';
import { broker_device_msg } from '../enums/mqtt-msg.enum';
import { LoadSecretsService } from '../../../load-secret/load-secret.service';
import { transform } from '../utils/transformer';
import { HttpService } from '@nestjs/axios';
import {  lastValueFrom } from 'rxjs';
import { EncryptResult, symEncryptor } from '../utils/encryptor';
import { FileLogger } from '../utils/file-logger';
import { decrypt } from 'dotenv';
import { symDecryptor } from '../utils/decryptor';


@Injectable()
export class MqttListenerService {
    private readonly logger = new Logger(MqttListenerService.name);

    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private qs: listnerQueryService,
        private ls: LoadSecretsService,
        private http: HttpService // LoadSecretsService contains the dynamic metricConfig
    ) { 
        
    }

    async processMessage(topic: string, payloadStr: string) {
        try {
            const payload = JSON.parse(payloadStr);
            if(topic.includes('/in/transaction')){ 
                const config = await this.ls.envSecrets['pcwd']
                const transformedPayload = await transform(payload, JSON.parse(config));
                await this.encryptMsgAndCallCwd(transformedPayload?.data)
            }

        } catch (error) {
            this.logger.error(`Error processing message: ${error.message}`);
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

   

    async encryptMsgAndCallCwd(payload){
        try {
            const timeStamp = Math.floor(Date.now() / 1000);
            let { security } = JSON.parse(this.ls.envSecrets['pcwd'])
            payload['deviceId'] = Number(payload['deviceId'])
            payload['rrn'] = payload?.reqRefNo;
            payload['timeStamp'] = timeStamp;
            const encryptedMsg = await symEncryptor(JSON.stringify(payload), security)
            if(encryptedMsg?.code === 200){
                this.logger.log('Encryption successful')
                let data = encryptedMsg?.data
                const {cwd_url } = JSON.parse(this.ls.envSecrets['pcwd']);
                console.log(cwd_url)
                const result  = await lastValueFrom(this.http.post(cwd_url, {"data": data},  {validateStatus: function (status) {
                    return status < 500;} // Resolve only if the status code is less than 500
                  },))
                if(result?.status === 200 || result?.status ==  201){
                    this.logger.log("Successful API call")
                    const decryptedData = await symDecryptor(result?.data?.data, security)
                    this.logger.log("Decryption Successful")
                    this.writeIntoResponseLog(payload?.reqRefNo, decryptedData.data)
                }else{
                    this.logger.error("Error From API", '')
                    const decryptedData = await symDecryptor(result?.data?.data, security)
                    this.writeIntoResponseLog(payload?.reqRefNo, decryptedData.data)
                }
            }  
        } catch (error) {
            this.logger.error("Intrernal Server Error", '')
            let {security} = JSON.parse(this.ls.envSecrets['pcwd'])
            this.writeIntoResponseLog(payload?.reqRefNo, {message: error?.message})
        }
       
       

    }

    async writeIntoResponseLog(reqRefNo: string, response){
        const logMessage = `${reqRefNo},  ${JSON.stringify(response)}`;
        FileLogger.log(logMessage);
    }

   
  
}
