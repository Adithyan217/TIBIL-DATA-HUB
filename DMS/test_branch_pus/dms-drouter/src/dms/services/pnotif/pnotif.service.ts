import { Pool } from 'pg';
import {forwardRef , HttpStatus , Inject , Injectable} from '@nestjs/common';
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
  public async createRouteWorkflow(details: any, iid: any, did: any, key: any, status: string, isSimulate: boolean = false): Promise<any> {
    let pid: number
    let context: string
    try {
        const result = await this.insertIntoPcache(details, iid, did, key, status);
        if (!result[0]?.is_deactivated && result[0]?.inserted_pid) {
            // pid = isSimulate? 'Simulate' + result[0]?.inserted_pid :  ;
            let {imei} = result[0]
            context = result[0]?.rcontext
            return this.transformAndPushMqtt(context, details, result[0]?.inserted_pid, imei, 0, isSimulate);
            }else{
            this.wslog.error('No Device Found or Device is Deactivated');
            return { code: HttpStatus.BAD_REQUEST, message: 'Device Deactivated'}
        }

    } catch (error) {
        this.wslog.error(`Inserted with PID: ${pid} but failed to transform the data`)
        await this.updatePaymentCacheStatus(switch_drouter_msg.RECEIVED_AND_FAILED, pid ,'', 0, 0);
        throw error;
    }
}

  public async transformAndPushMqtt(context, encyTxt, pid, imei, rtcount=0, isSimulate:boolean= false ) {

      try {
          const simulatePid =  isSimulate? 'Simulate'+pid : pid
          let transformedData  = await this.getTransformedData(context, {"payload": encyTxt,"cache_pid": simulatePid, did: imei })
          if(transformedData?.success){
              this.wslog.log(`Successfully Inserted into Payment Cache with PID: ${pid}`)
              let {decrypted_request, encrypted_response, mqtt_request, mqtt_topic} = transformedData?.data
              let {reqRefNo, txnAmt} = decrypted_request
              await this.updatePaymentCacheStatus(switch_drouter_msg.TRANSFORMED , pid, reqRefNo, txnAmt, rtcount)
              this.routeToAdapter(mqtt_request, mqtt_topic, pid, rtcount);
              return { code: paymentsMessage.SUCCESS_CODE, message: encrypted_response };
          }else{
              await this.updatePaymentCacheStatus(switch_drouter_msg.TRANSFORMATION_FAILED , pid, '', 0, rtcount);
              this.wslog.error('Could not transform Data', transformedData.message)
              return{ code: paymentsMessage.FAILURE_CODE, message: JSON.stringify({
                                                                                      "statMsg": "Failed to Insert",
                                                                                      "reqRefNo": "",
                                                                                      "statCode": "F"
                                                                                  })}
          }
      }
      catch (error) {
          await this.updatePaymentCacheStatus(switch_drouter_msg.TRANSFORMATION_FAILED , pid, '', 0, rtcount);
          this.wslog.error('Could not transform Data', error.message)
          return{ code: paymentsMessage.FAILURE_CODE, message: JSON.stringify({
                                                                                  "statMsg": "Failed to Insert",
                                                                                  "reqRefNo": "",
                                                                                  "statCode": "F"
                                                                              })}
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

  public async updatePaymentCacheStatus(status: string, pid:number, rrn: string, amount: number, rtCount:number): Promise<any> {
    const updateQuery = await this.qs.UpdateStatus(status, pid, rrn, amount, rtCount);
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
      this.wslog.error(`Error in inserting into Payment Cache:::`, error.message)
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

    
    routeToAdapter( topic: string, data: any, pid: any, rtCount:number){
      /* To be enhanced further to support multiple adapters*/
      this.mqttService.mqttWorkflowHandler(topic, data, pid, rtCount)

    }

    async getTransformedData(context: string, data:object){
    try {
      const result = await lastValueFrom(this.http.post(process.env.AXIOS_URL + '/transformer/serialize', {context, data}))
      if(result?.status === 201 || result?.status === 200){
        return {success: true, data: result?.data?.data}
      }else{
        return {success: false, message: result?.data.message}
      }
    } catch (error) {
      this.wslog.error(`Error in transforming data:::`, error)
      return {success: false, message: error.message}
    }

  }

   simulatePayment = async (body) => {
      try{
          const {amount, deviceId} = body;
          const paylaod ={
              "reqRefNo":"Simulate"+ deviceId,
              "deviceId":deviceId,
              "txnAmt": amount,
              "rrn":"1",
              "timeStamp": this.unixTimestamp()};
             const {query, values} =  await  this.qs.getRcontext(deviceId);
             const dbResult  = await this.pool.query(query, values);
             if ( dbResult.rowCount > 0 ) {
                const body= {
                    context: dbResult.rows[0].rcontext,
                    data : paylaod,
                    contextFlow: "simul_pay_ency_flow"
                }
                 const result = await lastValueFrom(this.http.post(process.env.AXIOS_URL + '/transformer/serialization', body));
                if (result?.status === 201 || result?.status === 200){
                    const encry = result.data.data.encrypted_response;
                   return await this.createRouteWorkflow(encry, 'ExampleIID112', deviceId, 'abc', switch_drouter_msg.SIMULATE_RECEIVED, true);
                }
             }
             else {
                 return {

                         code: paymentsMessage.FAILURE_CODE,
                         message: "Device Not Found"
                     }

             }

      }

      catch(error){
        return {
            code: HttpStatus.INTERNAL_SERVER_ERROR,
            message: error.message
        }
      }
  }
     unixTimestamp = (date = Date.now()) =>  {
        return Math.floor(date / 1000)
    }


    }



