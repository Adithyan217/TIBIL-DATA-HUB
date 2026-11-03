import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import * as awsIot from 'aws-iot-device-sdk';
import * as path from 'path';
import { MqttMsgLogService } from './cwd-mqtt/mqtt-listener.service';
import * as fs from 'fs';

@Injectable()
export class MqttSdkService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttSdkService.name);
  private device: awsIot.device | null = null; // Track the MQTT connection
  private topics: string[] = [];

  constructor(
    private msgLogMqttService: MqttMsgLogService,
  ) {
    if (process.env.SKIP_MQTT === 'true') {
      this.logger.warn('🚫 Skipping MQTT initialization due to SKIP_MQTT=true');
    } else {
      this.initializeMQTT(); // Only connect if not in secret-loading phase
    }
  }

  /**
   * Initializes MQTT connection
   */
  private initializeMQTT() {
    if (this.device) {
      this.logger.log('⚠️ MQTT device already initialized. Destroying previous connection.');
      this.destroyConnection();
    }

    const keyBase64 = process.env["MQTT-PRIVATE-KEY"];
    const certBase64 = process.env["MQTT-CERT-KEY"];
    const caBase64 = process.env["MQTT-CA-KEY"];

    if (!keyBase64 || !certBase64 || !caBase64) {
      throw new Error(
        '❌ Missing required environment variables: PRIVATE_KEY, CERT, or CA'
      );
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
      host: process.env["MQTT-HOST"], // AWS IoT Endpoint
      clean: false,
      autoResubscribe: true,
      offlineQueueing: true,
      keepalive: 30, // 👈 send ping every 30s
      reconnectPeriod: 2000, // 2s between reconnect attempts
      protocol: 'mqtts',
    });

    // this.topics = this.ls.metricConfig['listener_config']['topics'] || [];
    // this.logger.log(`📡 Topics to subscribe: ${JSON.stringify(this.topics)}`);

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
  subscribeToTopics(topic: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if (!this.device) {
            this.logger.error('❌ MQTT Device is not initialized.');
            reject(false); // Reject the promise if the device is not initialized
            return;
        }

        this.device.subscribe(topic, { qos: 1 }, (err, granted) => {
            if (err) {
                this.logger.error(`❌ Subscription error: ${err}`);
                reject(false); // Reject the promise on error
            } else {
                this.logger.log(`📡 Subscribed to topic: ${granted.map((g) => g.topic).join(', ')}`);
                resolve(true); // Resolve the promise with true on successful subscription
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
