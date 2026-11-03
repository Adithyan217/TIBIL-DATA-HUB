import {forwardRef , Module} from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { deviceRequestsController } from './controllers/devices/device_requests.controller';
import { DatabaseModule } from 'src/database/database.module';
import { QueryService } from './services/query/query.services';
import {  creatDeviceRequests } from './services/createdevicerequests/createdevicerequests.services';
import {CommonModule} from "../common/common.module";


@Module({
    imports: [DatabaseModule, HttpModule,  forwardRef(() => CommonModule)],
    controllers: [deviceRequestsController],
    providers: [creatDeviceRequests, QueryService],
})
export class DeviceRequestsModule {}
