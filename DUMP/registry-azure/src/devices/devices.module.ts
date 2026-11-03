import {forwardRef , Module} from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { devicesController } from './controllers/devices/devices.controller';
import { DatabaseModule } from 'src/database/database.module';
import { QueryService } from './services/query/query.services';
import {  onboardDevicesService } from './services/onboarddevices/onboarddevices.services';
import { CommonService } from 'src/common/service/common.service';
import { CommonqueryService} from "../common/service/commonquery.service";
import { DeviceInfoService } from './services/device-info/device-info.service';
import {CommonModule} from "../common/common.module";
import { onboardMsbDevicesService } from './services/onboarddevices/onboardmsbdevices.services';
import { PatchdeviceService } from './services/patchdevice/patchdevice.service';


@Module({
    imports: [DatabaseModule, HttpModule, forwardRef(() => CommonModule)],
    controllers: [devicesController],
    providers: [onboardDevicesService, onboardMsbDevicesService, QueryService, CommonService, CommonqueryService, DeviceInfoService, PatchdeviceService],
})
export class DevicesModule {}
