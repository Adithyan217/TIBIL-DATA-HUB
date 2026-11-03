import { Module } from '@nestjs/common';
import { MqttSdkController } from './controller/mqtt_sdk.controller';
import { MqttSdkService } from './services/mqtt_sdk.service';
import {  MqttMsgLogService } from './services/cwd-mqtt/mqtt-listener.service';
import { listnerQueryService } from './services/queries/pnotif-queries';
import { DatabaseModule } from '../database/database.module';
import { BroadcastService } from './services/broadcast/broadcast.service';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports:[DatabaseModule, HttpModule],
    controllers:[MqttSdkController],
    providers:[MqttSdkService, MqttMsgLogService, listnerQueryService, BroadcastService]
})
export class MqttSdkModule {}
