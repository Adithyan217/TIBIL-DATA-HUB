import { HttpModule } from '@nestjs/axios';
import {forwardRef , Module} from '@nestjs/common';
import { BanksController } from './controllers/bank/bank.controller';
import { onboardBankService } from './services/onboardbank/onboardbank.service';
import { DatabaseModule } from 'src/database/database.module';
import { QueryService } from './services/query/query.service';
import { CommonService } from 'src/common/service/common.service';
import {CommonqueryService} from '../common/service/commonquery.service';
import { CommonModule } from 'src/common/common.module';
import {BanksService} from "./services/banks/banks.service";

@Module({
  imports: [DatabaseModule, HttpModule,  forwardRef(() => CommonModule)],
  controllers: [BanksController],
  providers: [onboardBankService, QueryService, CommonqueryService, CommonService, BanksService],
})
export class BanksModule {}
