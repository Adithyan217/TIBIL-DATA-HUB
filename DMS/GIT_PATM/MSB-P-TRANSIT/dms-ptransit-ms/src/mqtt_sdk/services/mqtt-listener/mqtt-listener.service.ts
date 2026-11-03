import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { listnerQueryService } from '../queries/pnotif-queries';
import { broker_device_msg } from '../enums/mqtt-msg.enum';
import { LoadSecretsService } from 'src/load-secret/load-secret.service';
import { transform } from '../utils/transformer';
import { HttpService } from '@nestjs/axios';
import {  lastValueFrom } from 'rxjs';
import { EncryptResult, symEncryptor } from '../utils/encryptor';
import { FileLogger } from '../utils/file-logger';
import { decrypt } from 'dotenv';
import { symDecryptor } from '../utils/decryptor';
import * as fs from 'fs';
import path, { join } from 'path';
@Injectable()
export class MqttListenerService {
    private readonly logger = new Logger(MqttListenerService.name);

    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private qs: listnerQueryService,
        private ls: LoadSecretsService,
        private http: HttpService 
    ) { 
        
    }

    async processMessage(topic: string, payloadStr: string) {
        try {
            const payload = JSON.parse(payloadStr);
            if(topic.includes('/in/transaction')){ 
                const config = await this.ls.envSecrets['pcwd']
                const transformedPayload = await transform(payload, JSON.parse(config));
                this.logger.log(`Device ID , ${transformedPayload?.data?.deviceId}`)  
                const ifDeviceBlocked =  await this.readDeviceAndValidate(transformedPayload?.data?.deviceId)
                if(!ifDeviceBlocked){
                    this.logger.log("Device in Allowed List")
                    await this.encryptMsgAndCallCwd(transformedPayload?.data);
                }
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
            const encryptedMsg: any = await symEncryptor(JSON.stringify(payload), security)
            this.logger.log(`encrypted Msg::: ${encryptedMsg?.data}`)
            if(encryptedMsg?.code === 200){
                this.logger.log('Encryption successful')
                let data = encryptedMsg?.data
                const {cwd_url } = JSON.parse(this.ls.envSecrets['pcwd']);
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

    async readDeviceAndValidate(device) {
        const projectRoot = process.cwd();
        const configPath = join(projectRoot, 'src', 'devices.csv');
        
        try {
            // Use fs.readFileSync to read the file synchronously
            const data = fs.readFileSync(configPath, 'utf8');            
            const devices = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            const isDevicePresent = devices.includes(String(device));
            this.logger.log(`Device in Deny List:::${isDevicePresent}`)
            return isDevicePresent; // Return result directly
        } catch (err) {
            console.error('Error reading file:', err);
            return false; // Return false or handle error as needed
        }
    }
    
    

    async  addDeviceRecordsIntoFile(deviceList) {
        const projectRoot = process.cwd();
        const configPath = join(projectRoot, 'src', 'devices.csv');
    
        // Convert the deviceList to a string with each device on a new line
        const dataToWrite = deviceList.map(device => device.trim()).join('\n') + '\n'; // Ensure proper line breaks
    
        return new Promise((resolve, reject) => {
            fs.appendFile(configPath, dataToWrite, 'utf8', (err) => {
                if (err) {
                    console.error('Error appending to file:', err);
                    reject(err);
                    return;
                }
                this.logger.log('Device records added successfully!');
                resolve(true);
            });
        });
    }

    async  removeDeviceFromFile(deviceIdsToRemove) {
        const projectRoot = process.cwd();
        const configPath = join(projectRoot, 'src', 'devices.csv');
    
        return new Promise((resolve, reject) => {
            // Step 1: Read the file
            fs.readFile(configPath, 'utf8', (err, data) => {
                if (err) {
                    console.error('Error reading file:', err);
                    reject(err);
                    return;
                }
    
                // Step 2: Split the file content into lines (device IDs)
                const devices = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
                // Step 3: Remove the devices that are in the deviceIdsToRemove list
                const updatedDevices = devices.filter(device => !deviceIdsToRemove.includes(device));
    
                // Step 4: Join the updated list and prepare the data to be written
                const dataToWrite = updatedDevices.join('\n') + '\n';
    
                // Step 5: Write the updated data back to the file
                fs.writeFile(configPath, dataToWrite, 'utf8', (err) => {
                    if (err) {
                        console.error('Error writing to file:', err);
                        reject(err);
                        return;
                    }
                    this.logger.log('Device(s) removed successfully!');
                    resolve(true);
                });
            });
        });
    }

    async writeIntoResponseLog(reqRefNo: string, response){
        const logMessage = `${reqRefNo},  ${JSON.stringify(response)}`;
        FileLogger.log(logMessage);
    }

   
  
}
