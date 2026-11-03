import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { deviceRequestsController } from './controllers/devices/device_requests.controller';
import { DatabaseModule } from 'src/database/database.module';
import { QueryService } from './services/query/query.services';
import {  creatDeviceRequests } from './services/createdevicerequests/createdevicerequests.services';


@Module({
    imports: [DatabaseModule, HttpModule],
    controllers: [deviceRequestsController],
    providers: [creatDeviceRequests, QueryService],
})
export class DeviceRequestsModule {}
