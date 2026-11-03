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
import {MqttIotCoreService} from "../../adapters/mqtt_iot_core/mqtt_iot_core.service";
import { WinstonLoggerService } from '../winstonlogger/winstonlogger.service';

@Injectable()
export class PnotifService {
  constructor(
      @Inject('DATABASE_POOL') private readonly pool: Pool,
      private qs: pnotifQueryService,
      private readonly workerService: WorkerService,
      private http: HttpService,
      private mqttService: MqttHandlerService,
      private mqttIotCore: MqttIotCoreService,
      private wslog: WinstonLoggerService
  ) {

  }


  /* Below function can be enhanced to follow callStack Based approach */
  public async createRouteWorkflow(details: any, iid: any, did: any, key: any, status: string): Promise<any> {
    let pid: number
    let context: string
    try {
        const result = await this.insertIntoPcache(details, iid, did, key, status);
        if (!result[0]?.is_deactivated && result[0]?.inserted_pid) {
            pid = result[0]?.inserted_pid;
            let {imei} = result[0]
            context = result[0]?.rcontext
            let transformedData  = await this.getTransformedData(context, {"payload": details,"cache_pid": pid, did: imei })
            if(transformedData?.success){
            this.wslog.log(`Successfully Inserted into Payment Cache with PID: ${pid}`)
            let {decrypted_request, encrypted_response, mqtt_request, mqtt_topic} = transformedData?.data
            let {reqRefNo, txnAmt} = decrypted_request
            await this.updatePaymentCacheStatus('', pid, reqRefNo, txnAmt)
            this.routeToAdapter(mqtt_request, mqtt_topic, pid);
            return { code: paymentsMessage.SUCCESS_CODE, message: encrypted_response?.data };
          }else{
            this.wslog.error('Could not transform Data')
            return{ code: paymentsMessage.FAILURE_CODE, message: JSON.stringify({
              "statMsg": "Failed to Insert",
              "reqRefNo": "",
              "statCode": "F"
            })}
          }
            }else{
            this.wslog.error('No Device Found or Device is Deactivated');
            throw new Error('No Device Found or Device is Deactivated');
          }
            
    } catch (error) {
        this.wslog.error(`Inserted with PID: ${pid} but failed to transform the data`)
        await this.updatePaymentCacheStatus(switch_drouter_msg.RECEIVED_AND_FAILED, pid ,'', 0);
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

  public async updatePaymentCacheStatus(status: string, pid:number, rrn: string, amount: number): Promise<any> {
    const updateQuery = await this.qs.UpdateStatus(status, pid, rrn, amount);
    await this.pool.query(updateQuery?.query, updateQuery?.values);

  }


   async insertIntoPcache(details: any, iid:any, did:any, key: string, status: string){
    try {
      const queryStr = await this.qs.validateAndInsertIntoPcache();
      const values = [iid, did, key, details, status];
      const result = await this.pool.query(queryStr, values);
      if(result?.rows?.length > 0){
        return result?.rows
      } 
    } catch (error) {
      this.wslog.error(`Error in inserting into Payment Cache:::`, error)
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

    
    routeToAdapter( topic: string, data: any, pid: any){
      /* To be enhanced further to support multiple adapters*/
      this.mqttService.mqttWorkflowHandler(topic, data, pid)

    }

    async getTransformedData(context: string, data:object){
    try {
      const result = await lastValueFrom(this.http.post(process.env.AXIOS_URL + '/transformer/serialize', {context, data}))
      if(result?.status === 201 || result?.status === 200){
        return {success: true, data: result?.data?.data}
      }else{
        return {success: false}
      }
    } catch (error) {
      this.wslog.error(`Error in transforming data:::`, error)
      return {success: false}
    }

  }
    }



