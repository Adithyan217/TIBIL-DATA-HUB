import { Injectable } from '@nestjs/common';
import * as awsIot from 'aws-iot-device-sdk';
import {WinstonLoggerService} from '../winstonlogger/winstonlogger.service';
import {LoadSecretsService} from '../../../load-secrets/load-secrets.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AwsmqttService {
    private device: awsIot.device;
    constructor( private logger: WinstonLoggerService , private ls: LoadSecretsService ) {
        const secrets = ls.getSecrets();
        const keyBase64 = secrets.MQTT_PRIVATE_KEY;
        const certBase64 = secrets.MQTT_CERT_KEY;
        const caBase64 = secrets.MQTT_CA_KEY;
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        if (!keyBase64 || !certBase64 || !caBase64) {
            throw new Error("Missing required environment variables: PRIVATE_KEY, CERT, or CA");
        }

        const keyPath = this.decodeBase64ToFile(keyBase64, 'privateKey.pem', tempDir);
        const certPath = this.decodeBase64ToFile(certBase64, 'clientCert.pem', tempDir);
        const caPath = this.decodeBase64ToFile(caBase64, 'caCert.pem', tempDir);
        this.device = awsIot.device({
                                        keyPath,
                                        certPath,
                                        caPath,
                                        clientId: `client-${Math.random().toString(26).substr(3, 8)}`, // Unique client ID
                                        host: process.env.MQTT_HOST, // Your AWS IoT Endpoint
                                    });
        this.setupEventListeners();
    }

    private decodeBase64ToFile(base64Data: string, fileName: string, tempDir:string): string {
        const filePath = path.join(tempDir, fileName);
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        return filePath;
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
    async publishMessage(topic: string, message: object): Promise<boolean> {
        const options = { qos: 1 };
    
        if (!this.device) {
            this.logger.error('❌ MQTT Device not initialized.');
            return false;
        }
    
        return new Promise((resolve) => {
            this.device.publish(topic, JSON.stringify(message), options, (err) => {
                if (err) {
                    this.logger.error(`❌ Publish error: ${err}`);
                    resolve(false);
                } else {
                    this.logger.log(`📤 Message published to topic: ${topic}`);
                    resolve(true);
                }
            });
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
        this.logger.log('🚀 AwsmqttService initialized');
    }
    onModuleDestroy() {
        if (this.device) {
            this.device.end(false, () => {
                this.logger.log('🛑 Disconnected from AWS IoT Core');
            });
        }
    }



}
