import {forwardRef , Module} from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { firmwareController } from './controllers/firmware/firmwares.controller';
import { onboardFirmwareService } from './services/onboardfirmwares/onboardfirmwares.services';
import { DatabaseModule } from 'src/database/database.module';
import { QueryService } from './services/query/query.service';
import { CommonModule } from 'src/common/common.module';
import { CommonService } from 'src/common/service/common.service';
import { CommonqueryService } from 'src/common/service/commonquery.service';

@Module({
    imports: [DatabaseModule, HttpModule, forwardRef(() => CommonModule)],
    controllers: [firmwareController],
    providers: [onboardFirmwareService, QueryService, CommonService, CommonqueryService],
})
export class FirmwaresModule {}
