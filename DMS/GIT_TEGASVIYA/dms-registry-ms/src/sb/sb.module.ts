import { HttpModule } from '@nestjs/axios';
import {forwardRef , Module} from '@nestjs/common';
import { sbController } from './controllers/sb/sb.controller';
import { createSbService } from './services/createsb/createsb.service';
import { DatabaseModule } from 'src/database/database.module';
import { QueryService } from './services/query/query.service';
import { CommonService } from 'src/common/service/common.service';
import {CommonqueryService} from '../common/service/commonquery.service';
import { CommonModule } from 'src/common/common.module';
@Module({
  imports: [DatabaseModule, HttpModule,  forwardRef(() => CommonModule)],
  controllers: [sbController],
  providers: [createSbService, QueryService, CommonqueryService, CommonService],
})
export class SbModule {}
