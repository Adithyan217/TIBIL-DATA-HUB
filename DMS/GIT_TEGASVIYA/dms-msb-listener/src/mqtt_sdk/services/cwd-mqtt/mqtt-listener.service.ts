import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { listnerQueryService } from '../queries/pnotif-queries';
import { CODE, generateResponse } from '../enums/mqtt-msg.enum';
import { transform } from '../utils/transformer';
import { MqttSdkService } from '../mqtt_sdk.service';
import { BroadcastService } from '../broadcast/broadcast.service';

@Injectable()
export class MqttMsgLogService {
  private readonly logger = new Logger(MqttMsgLogService.name);

  private listenerConfig: any;

  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
    private qs: listnerQueryService,
    private bs: BroadcastService,
    @Inject(forwardRef(() => MqttSdkService)) private mqttsdk: MqttSdkService
  ) {
    try {
      const configJson = process.env['listener_config'];
      this.listenerConfig = configJson ? JSON.parse(configJson) : {};
      this.logger.log('Loaded listener_config from environment variable.');
    } catch (e) {
      this.logger.error('Failed to parse listener_config env var: ' + e.message);
      this.listenerConfig = {};
    }
  }

  async processMessage(topic: string, payloadStr: string) {
    try {
      const payload = JSON.parse(payloadStr);
      const imei = await this.extractIMEI(topic);
      const matchingConfig = await this.findMatchingConfig(topic, this.listenerConfig);
      if (!matchingConfig) {
        this.logger.log(`❌ No matching config found for topic: ${topic}`);
        return;
      }

      const transformedPayload = await transform(payload, matchingConfig['transformer']);
      const result = await this[matchingConfig['fnName']](imei, transformedPayload?.data);
      console.log("The result is:::", result);
    } catch (error) {
      this.logger.error(`❌ Error processing message: ${error.message}`);
    }
  }

    /**
     * Find the matching topic configuration in dynamically loaded metricConfig
     */
    findMatchingConfig(topic: string, metricsConfig: any) {
        for (const [pattern, config] of Object.entries(metricsConfig)) {
            if (this.matchTopic(topic, pattern)) {
                return config;
            }
        }
        return null;
    }

    /**
     * Convert MQTT wildcards (* and <imei>) to regex and check match
     */
    matchTopic(topic: string, pattern: string): boolean {
        const regexPattern = pattern
            .replace(/\*/g, '([^/]+)')  // Replace * with regex capturing group
            .replace(/<imei>/g, '([^/]+)'); // Replace <imei> with capturing group

        return new RegExp(`^${regexPattern}$`).test(topic);
    }

  async extractIMEI(topic: string) {
    const pattern = Object.keys(this.listenerConfig).find(p => this.matchTopic(topic, p));
    console.log("The pattern is:::", pattern);
    if (!pattern) return 'unknown';
    const topicParts = topic.split('/');
    const patternParts = pattern.split('/');
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] === '*' || patternParts[i] === '<imei>') {
        return topicParts[i];
      }
    }
    return 'unknown';
  }

  async insertTxnLog(imei: string, transformedPayload: any) {
    const { rrn, money } = transformedPayload;
    this.bs.broadcastMessage(rrn, money, imei);
    this.bs.addIntoBlog(rrn, money, imei);
  }

  async getTopicForManufacturer(mfname: string, imei: string) {
    const topic: any = this.listenerConfig[mfname];
    if (!topic) {
      this.logger.log(`❌ No topic found for manufacturer: ${mfname}`);
      return generateResponse(200, CODE.INVALID, `Topic Not Found`);
    }
    const matchingConfig = await this.replaceWildcardWithValue(topic, imei);
    if (!matchingConfig) {
      this.logger.log(`❌ No matching config found for topic: ${topic}`);
      return generateResponse(200, CODE.INVALID, `No matching config found`);
    }
    console.log("The matching config is:::", matchingConfig);
    const subscribeToTopic = await this.mqttsdk.subscribeToTopics(matchingConfig);
    if (subscribeToTopic) {
      return generateResponse(200, CODE.SUCCESS, `Subscribed to topic`);
    }
    return generateResponse(200, CODE.INVALID, `Failed to subscribe to topic`);
  }

  replaceWildcardWithValue(pattern: string, value: string): string {
    return pattern.replace(/\*/g, value);
  }
}
