import { Pool } from 'pg';
import {forwardRef, Inject, Injectable} from '@nestjs/common';
import { pnotifQueryService } from '../queries/pnotif-queries';
import {paymentStatus, paymentsMessage} from '../../../enums/payments_cache_status.enum'
import { MqttClientService } from '../mqtt/mqtt.service';
import { replacePlaceholder } from 'src/dms/utils/common.utils';
import { cwdTopics } from './topic.config';
@Injectable()
export class PnotifService {

//   topicList = []
  constructor(
      @Inject('DATABASE_POOL') private readonly pool: Pool,
      private mqttService: MqttClientService,
      // private sbCon: SbConnectorService,
      private qs: pnotifQueryService,
  ) {
    this.topicList =  cwdTopics
  }

  public async createpaymentRecord(details: any,  did:any,  status: string, context: string): Promise<any> {
    try {
      let rid = details?.request_id;
      const queryStr = await this.qs.insertPaymentRecord();
      const values = [did,JSON.stringify(details),rid, status];
      const queryResult = await this.pool.query(queryStr, values);
      if (queryResult?.rows?.length > 0) {
        let pid = queryResult?.rows[0]?.pid;
        this.updatePaymentCacheStatus(paymentStatus.RECEIVED,pid);
        let {pubTopic, subTopic, replaceValue} = this.topicList.filter(item => item.context === context)[0]
        let telemetryTopic = this.topicList.filter(item => item.context === 'telemetry')[0]
        this.updatePaymentCacheStatus(paymentStatus.SENT_REQUEST_TO_SWITCH,pid)
        this.callMqttToSubscribeToTopic(telemetryTopic?.subTopic, telemetryTopic?.replaceValue, did, null)
        const result  = await this.callMqttToPublish(pubTopic, subTopic, replaceValue,did, details,pid, rid)
        if(result){
          return {code:paymentsMessage.SUCCESS_CODE, message:paymentsMessage.SUCCESS_MESSAGE}
        }
      } else {
        return {code:paymentsMessage.FAILURE_CODE, data:paymentsMessage.FAILURE_MESSAGE}
      }

    } catch (e) {
        console.log("Error is:::", e)
        return {code:paymentsMessage.FAILURE_CODE, data:paymentsMessage.FAILURE_MESSAGE}
    }

  }

  

  async callMqttToPublish(pubTopic: string, subTopic: string, placeHolderKey: string, did: string, payload: Record<string, any>, 
    pid: number, rid: string
  ): Promise<boolean> {
    try {
      const replacedVal = replacePlaceholder(pubTopic, placeHolderKey, did);
      const result = await this.mqttService.publishMessage(replacedVal, payload);
      if (result) {
        console.log(`✅ Successfully published to topic: ${replacedVal}`);
        this.updatePaymentCacheStatus(paymentStatus.SUCCESS_RESPONSE_FROM_SWITCH, pid);
        this.callMqttToSubscribeToTopic(subTopic,placeHolderKey,did, rid)
        return true;
      } else {
        console.error(`Failed to publish to topic: ${replacedVal}`);
         this.updatePaymentCacheStatus(paymentStatus.FAILURE_RESPONSE_FROM_SWITCH, pid)
        return false;
      }
    } catch (error) {
      this.updatePaymentCacheStatus(paymentStatus.FAILURE_RESPONSE_FROM_SWITCH, pid)
      console.error(' Error during MQTT publish:', error);
      return false;
    }
  }

  async callMqttToSubscribeToTopic(subTopic: string, replaceValue: string, did: string, rid: string):Promise<boolean>{
    const replacedSubTopic = replacePlaceholder(subTopic, replaceValue, did);
    const result = await this.mqttService.subscribeToTopic(replacedSubTopic)
    if(result){
      this.insertIntoDlogsTable(rid, did, result)
      return true
    }else{
      return false
    }
  }
  
 
  public async updatePaymentCacheStatus(status: string, pid:number): Promise<any> {
    const query = await this.qs.UpdateStatus();
    this.pool.query(query, [status, pid]);
  }

  private async insertIntoDlogsTable(rid:string, did: string, message: {})
    {
      const query = await this.qs.insertIntoLogs();
      this.pool.query(query, [rid, did, message]);
    }
  
  public async getLogsForReqId(rid: string){
    const query = await this.qs.getReqLogs()
    const result = await this.pool.query(query,[rid])
    if(result?.rowCount > 0){
      return {code: paymentsMessage.SUCCESS_CODE, data: result.rows}
    }else{
      return {code: paymentsMessage.FAILURE_CODE, message: 'No Data'}
    }
  }

  public async getTelemetryLogsForDid(did: string){
  const query = await this.qs.getTelemetryLogs()
  const result = await this.pool.query(query,[did])
  if(result?.rowCount > 0){
    return {code: paymentsMessage.SUCCESS_CODE, data: result.rows}
  }else{
    return {code: paymentsMessage.FAILURE_CODE, message: 'No Data'}
  }
}
}