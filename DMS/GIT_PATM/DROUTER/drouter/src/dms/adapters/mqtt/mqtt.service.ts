import { Injectable } from '@nestjs/common';
import * as mqtt from 'mqtt';


@Injectable()
export class MqttBrokerService {
  private client;
  private isInitialized = false;

  async initializeClient(host,bcert, bkey, ca): Promise<boolean> {
    const connectUrl = `${host}`;
    this.client = mqtt.connect(connectUrl, {
      
      clean: true,
      connectTimeout: 10000,
      reconnectPeriod: 10000, 
      key: Buffer.from(bkey , 'base64').toString('ascii'),
      cert: Buffer.from(bcert , 'base64').toString('ascii'),
      ca: Buffer.from(ca , 'base64').toString('ascii'),
    });

    return new Promise((resolve, reject) => {
      this.client.on('connect', () => {
        console.log('✅ Connected securely to MQTT broker');
        this.isInitialized = true;
        resolve(true);
      });

      this.client.on('error', (error) => {
        console.error('❌ Connection error:', error);
        this.isInitialized = false;
        reject(false);
      });

      this.client.on('offline', () => {
        console.warn('⚠️ Client is offline');
      });

      this.client.on('close', () => {
        console.log('🔒 Connection closed');
      });

      this.client.on('end', () => {
        console.log('🔒 Client disconnected intentionally');
        this.isInitialized = false;
      });
    });
  }

  isClientInitialized(): boolean {
    return this.isInitialized;
  }

  async publishMessage(topic: string, payload: Record<string, any>): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('❌ Cannot publish, MQTT client is not initialized.');
      return false;
    }

    const message = JSON.stringify(payload);
    console.log(`🚀 Publishing message to topic: ${topic}`);

    return new Promise((resolve) => {
      this.client.publish(topic, message, { qos: 0, retain: false }, (error) => {
        if (error) {
          console.error('❌ Publish error:', error);
          resolve(false);
        } else {
          console.log('✅ Message published:', message);
          resolve(true);
        }
      });
    });
  }


  async subscribeToTopic(topic: string): Promise<string> {
    if (!this.isClientInitialized()) {
      console.error('❌ Cannot subscribe, MQTT client is not initialized.');
      throw new Error('MQTT client is not initialized.');
    }
  
    console.log(`📡 Subscribing to topic: ${topic}`);
  
    return new Promise((resolve, reject) => {
      try {
        this.client.subscribe(topic, { qos: 1 }, (error, granted) => {
          if (error) {
            console.error('❌ Subscription error:', error);
            reject('Subscription failed');
          } else {
            console.log(`✅ Subscribed successfully to topic: ${topic}`, granted);
          }
        });
  
        this.client.on('message', (receivedTopic, payload) => {
          if (receivedTopic === topic) {
            console.log(`📥 Message received on topic ${receivedTopic}:`, payload.toString());
            resolve(payload.toString());
          }
        });
      } catch (error) {
        console.error('❌ Unexpected error during subscription:', error);
        reject('Unexpected subscription failure');
      }
    });
  }

  async mqttWorkflowHandler(config:any, data: any){
    let host = config?.host
    let { broker_cert, broker_key, ca_file} = config?.initialization;
    if(host && broker_cert && broker_key && ca_file){
      const isConnectionActive = await this.initializeClient(host, broker_cert, broker_key, ca_file)
      console.log("Connection Status is:::", isConnectionActive);

    }else{
      console.log("Unable to Connect")
    }
  }


}

