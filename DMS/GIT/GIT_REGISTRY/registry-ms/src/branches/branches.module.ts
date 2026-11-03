import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BranchController } from './controllers/branch/branch.controller';
import { onboardBranchService } from './services/onboardbranch/onboardbranch.service';
import { DatabaseModule } from 'src/database/database.module';
import { QueryService } from './services/query/query.service';
import { CommonService } from 'src/common/service/common.service';
import {CommonqueryService} from '../common/service/commonquery.service';
import { commonModule } from 'src/common/common.module';


@Module({
    imports: [DatabaseModule, HttpModule],
    controllers: [BranchController],
    providers: [onboardBranchService, QueryService, CommonqueryService, CommonService],
})
export class BranchesModule {}
