import { Module } from '@nestjs/common';
import { MqttSdkController } from './controller/mqtt_sdk.controller';
import { MqttSdkService } from './services/mqtt_sdk.service';
import {  MqttListenerService } from './services/mqtt-listener/mqtt-listener.service';
import { listnerQueryService } from './services/queries/pnotif-queries';
import { DatabaseModule } from '../database/database.module';
import { LoadSecretsService } from 'src/load-secret/load-secret.service';
import { HttpModule, HttpService } from '@nestjs/axios';

@Module({
    imports:[DatabaseModule, HttpModule],
    controllers:[MqttSdkController],
    providers:[MqttSdkService, MqttListenerService, listnerQueryService, LoadSecretsService]
})
export class MqttSdkModule {}
