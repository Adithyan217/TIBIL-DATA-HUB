import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { BanksController } from './controllers/bank/bank.controller';
import { onboardBankService } from './services/onboardbank/onboardbank.service';
import { DatabaseModule } from 'src/database/database.module';
import { QueryService } from './services/query/query.service';
import { CommonService } from 'src/common/service/common.service';
import {CommonqueryService} from '../common/service/commonquery.service';
import { commonModule } from 'src/common/common.module';

@Module({
  imports: [DatabaseModule, HttpModule],
  controllers: [BanksController],
  providers: [onboardBankService, QueryService, CommonqueryService, CommonService],
})
export class BanksModule {}
