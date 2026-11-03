import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { mfController } from './controllers/mf/mf.controller';
import { onboardMfService } from './services/onboardmf/onboardmf.services';
import { DatabaseModule } from 'src/database/database.module';
import { QueryService } from './services/query/query.service';
import { CommonService } from 'src/common/service/common.service';
import {CommonqueryService} from '../common/service/commonquery.service';
import { commonModule } from 'src/common/common.module';
@Module({
    imports: [DatabaseModule, HttpModule, commonModule],
    controllers: [mfController],
    providers: [onboardMfService, QueryService],
})
export class MfModule {}
