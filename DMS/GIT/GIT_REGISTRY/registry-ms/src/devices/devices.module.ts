import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { devicesController } from './controllers/devices/devices.controller';
import { DatabaseModule } from 'src/database/database.module';
import { QueryService } from './services/query/query.services';
import {  onboardDevicesService } from './services/onboarddevices/onboarddevices.services';
import { CommonService } from 'src/common/service/common.service';
import { CommonqueryService} from "../common/service/commonquery.service";
import { DeviceInfoService } from './services/device-info/device-info.service';


@Module({
    imports: [DatabaseModule, HttpModule],
    controllers: [devicesController],
    providers: [onboardDevicesService, QueryService, CommonService, CommonqueryService, DeviceInfoService],
})
export class DevicesModule {}
