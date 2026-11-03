import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MerchantController } from './controllers/merchant/merchant.controller';
import { onboardMerchantService } from './services/onboardmerchants/onboardmerchant.services';
import { DatabaseModule } from 'src/database/database.module';
import { QueryService } from './services/query/query.services';
import { CommonService } from 'src/common/service/common.service';
import { CommonqueryService } from 'src/common/service/commonquery.service';

@Module({
  imports: [DatabaseModule, HttpModule],
  controllers: [MerchantController],
  providers: [onboardMerchantService, QueryService,CommonService,CommonqueryService],
})
export class MerchantsModule {}
