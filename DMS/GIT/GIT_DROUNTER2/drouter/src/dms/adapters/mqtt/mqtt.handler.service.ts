import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { MqttBrokerService } from './mqtt.service';
import { replacePlaceholder, replacer } from 'src/dms/utils/transformer';
import { WorkerService } from 'src/dms/services/worker/worker.service';
import { drouter_mqtt_msg } from 'src/enums/payments_cache_status.enum';
import { pnotifQueryService } from 'src/dms/services/queries/pnotif-queries';
import { Pool } from 'pg';
import { promises as fs } from 'fs';


@Injectable()
export class MqttHandlerService {
  // transformWorker = this.workerService.getWorker('transformer');
  constructor(
    private mqttService: MqttBrokerService,
    private workerService: WorkerService,
    private qs: pnotifQueryService,
    @Inject('DATABASE_POOL') private readonly pool: Pool
  ){

  }

  private connectionMap: Map<string, boolean> = new Map(); 

async mqttWorkflowHandler(config: any, data: any, did: any, pid: any) {
  try {
    let host = config?.host;
    let { broker_cert, broker_key, ca_file } = config?.initialization;
    if (host && broker_cert && broker_key && ca_file) {
      if (!this.connectionMap.get(host)) {
        const isConnectionActive = await this.mqttService.initializeClient(host, broker_cert, broker_key, ca_file);
        this.connectionMap.set(host, isConnectionActive);
      } else {
        console.log(`MQTT connection for host ${host} is already active. Skipping initialization.`);
      }
      if (this.connectionMap.get(host)) {
        // const dPayload = {
        //   context: "transform",
        //   config: {
        //     payload: config?.payload,
        //     replacer: config?.payloadReplace,
        //   },
        //   data: data,
        // };
        // let dPayloadReplacedValue: any = await this.workerService.runWorkerTask(this.transformWorker, dPayload);
        // let pubTopicReplacedVal = await replacePlaceholder(config?.pub?.url, config?.pub?.replace, did);
        this.updateCacheStatus( drouter_mqtt_msg.SENT_REQUEST_TO_MQTT, pid);
        const pubTopic = '/api/v1/device/1/publish/transaction'
        const pubRes = await this.mqttService.publishMessage(pubTopic, data);
        if (pubRes) {
          await this.updateCacheStatus(drouter_mqtt_msg.SUCCESS_RESPONSE_FROM_MQTT, pid);
        } else {
          await this.updateCacheStatus(drouter_mqtt_msg.FAILURE_RESPONSE_FROM_MQTT, pid);
        }
      }
    } else {
      console.log("Connection details are incomplete or invalid. Unable to connect.");
    }
  } catch (error) {
    console.error("Error in MQTT Handler is:::", error);
  }
}

  async updateCacheStatus(status: drouter_mqtt_msg, pid: number){
    try {
      let updateQuery = await this.qs.UpdateStatus();
      let result = await this.pool.query(updateQuery, [status, pid])
    } catch (error) {
      console.error("Error while updating the cache Status");
    }
    
   
  }

  async insertIntoPlog(pid:number, status:drouter_mqtt_msg): Promise<any> {
    try {
      const content = `p${pid}\n`;

      // Use async/await to append the content
      // await fs.appendFile('example1.txt', content);
  
      // console.log(`Content successfully appended for pid=${pid}`);
      let insertQuery = await this.qs.insertIntoPLog();
      let result = await this.pool.query(insertQuery, [pid, status]);
      return result.rows;
    } catch (error) {
      console.error("Error while inserting into cache", error);
    }
  }
  


}

