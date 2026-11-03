import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import * as awsIot from 'aws-iot-device-sdk';
import * as path from 'path';
import * as fs from 'fs';
import { MqttMsgLogService } from './cwd-mqtt/mqtt-listener.service';

@Injectable()
export class MqttSdkService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttSdkService.name);
  private device: awsIot.device | null = null;
  private topics: string[] = [];
  private listenerConfig: any = {};

  constructor(private msgLogMqttService: MqttMsgLogService) {
    if (process.env.SKIP_MQTT === 'true') {
      this.logger.warn('🚫 Skipping MQTT initialization due to SKIP_MQTT=true');
    } else {
      this.loadListenerConfig();
      this.initializeMQTT();
    }
  }
  /**
   * Load listener config from process.env
   */
  private loadListenerConfig() {
    try {
      this.listenerConfig = JSON.parse(process.env['listener-config'] || '{}');
      this.topics = this.listenerConfig?.topics || [];
      this.logger.log(`📡 Topics loaded: ${JSON.stringify(this.topics)}`);
    } catch (err) {
      this.logger.error('❌ Failed to parse listener-config from env', err);
      this.topics = [];
      this.listenerConfig = {};
    }
  }


  /**
   * Initialize MQTT connection
   */
  private initializeMQTT() {
    if (this.device) {
      this.logger.log('⚠️ MQTT device already initialized. Destroying previous connection.');
      this.destroyConnection();
    }

    const keyBase64 = process.env['MQTT-PRIVATE-KEY'];
    const certBase64 = process.env['MQTT-CERT-KEY'];
    const caBase64 = process.env['MQTT-CA-KEY'];

    if (!keyBase64 || !certBase64 || !caBase64) {
      throw new Error('❌ Missing required environment variables: MQTT-PRIVATE-KEY, MQTT-CERT-KEY, or MQTT-CA-KEY');
    }

    // Create temp directory for certificates
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    function decodeBase64ToFile(base64Data: string, fileName: string): string {
      const filePath = path.join(tempDir, fileName);
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      return filePath;
    }

    const keyPath = decodeBase64ToFile(keyBase64, 'privateKey.pem');
    const certPath = decodeBase64ToFile(certBase64, 'clientCert.pem');
    const caPath = decodeBase64ToFile(caBase64, 'caCert.pem');

    this.device = awsIot.device({
      keyPath,
      certPath,
      caPath,
      clientId: `mqtt-apprunner-${process.env.ENVIRONMENT}-client-${Date.now()}`, // Unique client ID
      host: process.env['MQTT-HOST'],
      clean: false,
      autoResubscribe: true,
      offlineQueueing: true,
    });

    this.setupEventListeners();
  }

  /**
   * Called when the module initializes
   */
  onModuleInit() {
    this.logger.log('🚀 MqttSdkService initialized');
  }

  /**
   * Called when the module is destroyed
   */
  onModuleDestroy() {
    this.logger.log('⚠️ Shutting down MQTT service...');
    this.destroyConnection();
  }

  /**
   * Gracefully disconnect the MQTT device
   */
  private destroyConnection() {
    if (this.device) {
      this.logger.log('⚠️ Closing MQTT connection...');
      this.device.end(false, () => {
        this.logger.log('✅ MQTT connection closed.');
      });
      this.device = null; // Ensure the device is reset
    }
  }

  /**
   * Set up event listeners for MQTT
   */
  private setupEventListeners() {
    if (!this.device) {
      this.logger.error('❌ MQTT Device is not initialized.');
      return;
    }

    this.device.on('connect', () => {
      this.logger.log('✅ Connected to AWS IoT Core');
      this.subscribeToTopics();
    });

    this.device.on('message', (topic, payload) => {
      this.logger.log(`📨 Received message on topic '${topic}': ${payload.toString()}`);
      this.validateAndCallMfHandler(topic, payload.toString());
    });

    this.device.on('error', (error) => {
      this.logger.error(`❌ AWS IoT Error: ${error}`);
    });

    this.device.on('close', () => {
      this.logger.log('⚠️ Connection closed. Attempting to reconnect...');
    });

    this.device.on('reconnect', () => {
      this.logger.log('🔄 Reconnecting to AWS IoT Core...');
    });
  }

  /**
   * Subscribe to all topics from config
   */
  private subscribeToTopics() {
    if (!this.device) {
      this.logger.error('❌ MQTT Device is not initialized.');
      return;
    }

    this.topics.forEach((topic) => {
      this.device?.subscribe(topic, { qos: 1 }, (err, granted) => {
        if (err) {
          this.logger.error(`❌ Subscription error: ${err}`);
        } else {
          this.logger.log(`📡 Subscribed to topic: ${granted.map((g) => g.topic).join(', ')}`);
        }
      });
    });
  }

  /**
   * Publish a message to an MQTT topic
   */
  publishMessage(topic: string, message: object) {
    if (!this.device) {
      this.logger.error('❌ MQTT Device is not initialized.');
      return;
    }

    this.device.publish(topic, JSON.stringify(message), (err) => {
      if (err) {
        this.logger.error(`❌ Publish error: ${err}`);
      } else {
        this.logger.log(`📨 Message published to '${topic}': ${JSON.stringify(message)}`);
      }
    });
  }

  

  /**
   * Handle incoming messages and route to correct function
   */
  validateAndCallMfHandler(topic: string, payload: string) {
    this.msgLogMqttService.processMessage(topic, payload);
  }
}
