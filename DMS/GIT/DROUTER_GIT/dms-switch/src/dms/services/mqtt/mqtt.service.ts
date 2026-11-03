import { Injectable } from '@nestjs/common';
import * as mqtt from 'mqtt';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MqttClientService {
  private client;
  private isInitialized = false;

  constructor(){
    this.initializeClient()
  }

  async initializeClient() {
    const projectRoot = process.cwd();
    const configPath = path.join(projectRoot, 'src', 'certificates');
    const connectUrl = `mqtts://sandbox.dms.mqtt.pocketatm.in:8883`;
    let clientId = process.env.MQTT_CLIENT;
    let username = process.env.MQTT_UNAME || '';
    let password = process.env.MQTT_PWD || '';
    this.client = mqtt.connect(connectUrl, {
      clientId,
      clean: true,
      connectTimeout: 4000,
      username,
      password,
      reconnectPeriod: 10000, // Increased reconnect period
      key: fs.readFileSync(path.join(configPath, 'server.key')),
      cert: fs.readFileSync(path.join(configPath, 'server.crt')),
      ca: fs.readFileSync(path.join(configPath, 'ca.crt')),
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
  
}