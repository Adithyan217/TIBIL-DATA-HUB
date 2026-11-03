import {forwardRef , Module} from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { deviceIssuessController } from './controllers/devices/device_issues.controller';
import { DatabaseModule } from 'src/database/database.module';
import { QueryService } from './services/query/query.services';
import { creatDeviceIssues } from './services/createdeviceissues/createdeviceissues.services';
import {CommonModule} from "../common/common.module";


@Module({
    imports: [DatabaseModule, HttpModule,  forwardRef(() => CommonModule)],
    controllers: [deviceIssuessController],
    providers: [creatDeviceIssues, QueryService],
})
export class DeviceIssuessModule {}
