import { Pool } from 'pg';
import {forwardRef, Inject, Injectable} from '@nestjs/common';
import { pnotifQueryService } from '../queries/pnotif-queries';
import {notifierType, switch_drouter_msg, paymentsMessage} from '../../../enums/payments_cache_status.enum'
import { WorkerService } from '../worker/worker.service';
import {RcacheService} from '../rcache/rcache.service';
import {DcacheService} from '../dcache/dcache.service';
import { MqttHandlerService } from 'src/dms/adapters/mqtt/mqtt.handler.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, retry } from 'rxjs';
@Injectable()
export class PnotifService {
  constructor(
      @Inject('DATABASE_POOL') private readonly pool: Pool,
      private qs: pnotifQueryService,
      private readonly workerService: WorkerService,
      private http: HttpService,
      private rcacheService: RcacheService,
      private dcacheService: DcacheService,
      private mqttService: MqttHandlerService
  ) {

  }
  decryptWorker = this.workerService.getWorker('decrypter');
  transformWorker = this.workerService.getWorker('transformer');
  encryptWorker = this.workerService.getWorker('encrypter');

  /* Below function can be enhanced to follow callStack Based approach */
  public async createRouteWorkflow(details: any, iid: any, did: any, key: any, status: string): Promise<any> {
    let pid: number
    try {
        const result = await this.insertIntoCache(details, iid, did, key, status);
        if (result?.length > 0) {
            pid = result[0]?.pid;
            let rid: number = await this.dcacheService.getCacheData(did);
            console.log("rid is:::", rid);
            if (!rid) {
                throw new Error("No rid found");
            }
            let rconfig: any = await this.rcacheService.getCacheData(rid);
            let transformedData  = await this.getTransformedData()
            if(transformedData?.success){
            let {decrypted_request, encrypted_response, mqtt_request} = transformedData?.data
            console.log("The transformed data status is:::", transformedData?.success)
            this.routeToAdapter(mqtt_request, rconfig?.dconfig?.drouter_mqtt, did, pid);
            return { code: paymentsMessage.SUCCESS_CODE, message: encrypted_response?.data };
          }else{
            return{ code: paymentsMessage.FAILURE_CODE, message: JSON.stringify({
              "statMsg": "Failed to Insert",
              "reqRefNo": "",
              "statCode": "F"
            })}
          }
            }
            
    } catch (error) {
        await this.updatePaymentCacheStatus(switch_drouter_msg.RECEIVED_AND_FAILED, pid);
        throw error;
    }
}
  public async getPaymentRecords(): Promise<any> {
    try {
      const query = `SELECT *
                     FROM dms.payments_cache;`;
      const result = await this.pool.query(query, []);
      if (result.rows.length > 0) {
        return {code: paymentsMessage.SUCCESS_CODE, data: result?.rows};
      } else {
        return {code: paymentsMessage.FAILURE_CODE};
      }
    } catch (e) {
      return {code: paymentsMessage.FAILURE_CODE, error: 'Unable to create a record'};
    }
  }

  public async updatePaymentCacheStatus(status: string, pid:number): Promise<any> {
    const query = await this.qs.UpdateStatus();
    await this.pool.query(query, [status, pid]);

  }


   async insertIntoCache(details: any, iid:any, did:any, key: string, status: string){
    try {
      const queryStr = await this.qs.insertPaymentRecord();
      const values = [iid,did,key,JSON.stringify(details), status];
      const result = await this.pool.query(queryStr, values);
      if(result?.rows?.length > 0){
        return result?.rows
      } 
    } catch (error) {
      console.log("Error is:::", error)
      return []
    }
     

    }

   async getRouteConfigForDevice(did: number){
    let url = process.env.AXIOS_URL +'/registry/routes/get'
    let body = {
      "did": did
    }
    let result = await lastValueFrom(this.http.post(url, body)) 
    if(result?.status === 201 || result?.status === 200){
      return {success: true, data: result?.data?.data[0]}
    }else{
      return {success: false}
    }

    }

    async encryption(details, econfig){
      const data = {
        "data": details,
        "config": econfig
      }
      console.log("The config for encryption is:::", data?.config)
      const eResult  = await this.workerService.runWorkerTask(this.encryptWorker, data) 
      return eResult as {success: boolean, encrypted: any } | {success: boolean, error: any }
    }
    async decryption(details, dconfig){
        const data = {
          "data": details,
          "config": dconfig
        }
        console.log("The config for decryption is:::", data?.config)
        const dResult  = await this.workerService.runWorkerTask(this.decryptWorker, data) 
        return dResult
    }
    async transformation(data: any, tconfig: any, status: boolean = false){
      let tdata: any = {
        context: "transform",
        data: data,
        config: {
            replacer: tconfig?.payloadReplacer,
            ...(status 
                ? { payload: tconfig?.successPayload } 
                : { payload: tconfig?.failurePayload }
            )
        }
    }; 
       const transformedResult  = await this.workerService.runWorkerTask(this.transformWorker, tdata)
       return transformedResult
    }
    routeToAdapter(data: any, config: any, did: any, pid: any){
      if(config?.notifier === notifierType.MQTT){
        this.mqttService.mqttWorkflowHandler(config, data, did, pid)
      }

    }

    async getTransformedData(){
      const result = await lastValueFrom(this.http.post(process.env.AXIOS_URL + '/processed-data', {}))
      if(result?.status === 201 || result?.status === 200){
        return {success: true, data: result?.data}
  } else{
    return {success: false}
  }
    }


}
