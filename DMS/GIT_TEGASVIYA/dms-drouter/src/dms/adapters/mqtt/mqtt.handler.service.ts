import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { MqttBrokerService } from './mqtt.service';
import { replacePlaceholder, replacer } from 'src/dms/utils/transformer';
import { WorkerService } from 'src/dms/services/worker/worker.service';
import { drouter_mqtt_msg } from 'src/enums/payments_cache_status.enum';
import { pnotifQueryService } from 'src/dms/services/queries/pnotif-queries';
import { Pool } from 'pg';
import { MqttIotCoreService } from '../mqtt_iot_core/mqtt_iot_core.service';


@Injectable()
export class MqttHandlerService {
  constructor(
    private mqttMosquitoService: MqttBrokerService,
    private workerService: WorkerService,
    private qs: pnotifQueryService,
    private AWS_IOT_CORE: MqttIotCoreService,

    @Inject('DATABASE_POOL') private readonly pool: Pool
  ){ }

  private connectionMap: Map<string, boolean> = new Map(); 

async mqttWorkflowHandler(mqtt_payload: any, topic: any, pid: any) {
  try {

    this.updateCacheStatus( drouter_mqtt_msg.SENT_REQUEST_TO_MQTT, pid);
    await this[process.env["MQTT-BROKER"]].publishMessage(topic, mqtt_payload);
    


  } catch (error) {
    console.error("Error in MQTT Handler is:::", error);
  }
}


  async mqttMosquito(config: any, data: any, did: any, pid: any, topic: string) {
    let host = config?.host;
    let { broker_cert, broker_key, ca_file } = config?.initialization;
    if (host && broker_cert && broker_key && ca_file) {
      if (!this.connectionMap.get(host) ) {
        const isConnectionActive = await this.mqttMosquitoService.initializeClient(host, broker_cert, broker_key, ca_file);
        this.connectionMap.set(host, isConnectionActive);
      } else {
        console.log(`MQTT connection for host ${host} is already active. Skipping initialization.`);
      }
      if (this.connectionMap.get(host)) {
       return await this.mqttMosquitoService.publishMessage(topic, data);
      }
    } else {
      console.log("Connection details are incomplete or invalid. Unable to connect.");
      return false;
    }

  }


  async updateCacheStatus(status: drouter_mqtt_msg, pid: number){
    try {
      let updateQuery = await this.qs.UpdateStatus(status, pid, '', 0);
      let result = await this.pool.query(updateQuery.query, updateQuery.values)
    } catch (error) {
      console.error("Error while updating the cache Status");
    }
    
   
  }

  async insertIntoPlog(pid:number, status:drouter_mqtt_msg): Promise<any> {
    try {
      const content = `p${pid}\n`;
      let insertQuery = await this.qs.insertIntoPLog();
      let result = await this.pool.query(insertQuery, [pid, status]);
      return result.rows;
    } catch (error) {
      console.error("Error while inserting into cache", error);
    }
  }
  


}

