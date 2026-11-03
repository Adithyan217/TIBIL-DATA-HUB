import {
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
    Logger,
} from '@nestjs/common';
import * as awsIot from 'aws-iot-device-sdk';
import * as path from 'path';
import * as fs from 'fs';


@Injectable()
export class MqttIotCoreService  implements OnModuleInit{
    private readonly logger = new Logger( MqttIotCoreService.name);
    private device: awsIot.device;
    constructor( ) {
    const keyBase64 = process.env["MQTT-PRIVATE-KEY"];
    const certBase64 = process.env["MQTT-CERT-KEY"];
    const caBase64 = process.env["MQTT-CA-KEY"];
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    function decodeBase64ToFile(base64Data: string, fileName: string): string {
      const filePath = path.join(tempDir, fileName);
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      return filePath;
    }
    if (!keyBase64 || !certBase64 || !caBase64) {
      throw new Error("Missing required environment variables: PRIVATE-KEY, CERT, or CA");
    }

    const keyPath = decodeBase64ToFile(keyBase64, 'privateKey.pem');
    const certPath = decodeBase64ToFile(certBase64, 'clientCert.pem');
    const caPath = decodeBase64ToFile(caBase64, 'caCert.pem');
    this.device = awsIot.device({
      keyPath,
      certPath,
      caPath,
      clientId: `client-${Math.random().toString(26).substr(3, 8)}`, // Unique client ID
      host: process.env["MQTT-HOST"], // Your AWS IoT Endpoint
    });
    this.setupEventListeners();
    }
    private setupEventListeners() {
        this.device.on('connect', () => {
            this.logger.log('✅ Connected to AWS IoT Core');

        });

        this.device.on('error', (error) => {
            this.logger.error('❌ AWS IoT Error:', error);
        });

        this.device.on('close', () => {
            this.logger.warn('⚠️ Connection closed. Attempting to reconnect...');
        });

        this.device.on('reconnect', () => {
            this.logger.log('🔄 Reconnecting to AWS IoT Core...');
        });
    }

    /**
     * Publish a message to an AWS IoT Core MQTT topic
     * @param {string} topic - The MQTT topic to publish to
     * @param {object} message - The JSON message to send
     */
    publishMessage(topic: string, message: object) {
        const options = { qos: 1 };
        if (!this.device) {
            this.logger.error('❌ MQTT Device not initialized.');
            return false;
        }

        this.device.publish(topic, JSON.stringify(message), options, (err) => {
            if (err) {
                this.logger.error(`❌ Publish error: ${err}`);
                return false;
            } else {
                this.logger.log(`📤 Published message to topic: ${topic}`);
                return true;
               
            }
        });
    }

    /**
     * Subscribe to an MQTT topic
     * @param {string} topic - The topic to subscribe to
     */
    subscribeToTopic(topic: string) {
        this.device.subscribe(topic, (err, granted) => {
            if (err) {
                this.logger.error(`❌ Subscription error: ${err}`);
            } else {
                this.logger.log(
                    `📡 Subscribed to topic: ${granted.map((g) => g.topic).join(', ')}`,
                );
            }
        });
    }
    onModuleInit() {
        this.logger.log('🚀 MqttService initialized');
    }

}
