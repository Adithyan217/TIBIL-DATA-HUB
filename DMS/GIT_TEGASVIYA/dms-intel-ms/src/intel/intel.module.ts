import {forwardRef , Module} from '@nestjs/common';
import { IntelService } from './services/intel/intel.service';
import { DatabaseModule } from 'src/database/database.module';
import { IntelController } from './controller/intel/intel.controller';
import { QueryService } from './services/query/query.service';
import {WinstonLoggerService} from "../common/winstonlogger/winstonlogger.service";

@Module({
  imports:[forwardRef(() =>DatabaseModule ) ],
  providers: [IntelService, QueryService, WinstonLoggerService],
  controllers:[IntelController],
  exports: [WinstonLoggerService]
})
export class IntelModule {}
