import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from 'src/database/database.module';
import { CommonService } from './service/common.service';
import { CommonqueryService } from './service/commonquery.service';
import { CommonController } from './controller/common.controller';
import { WinstonLoggerService } from './service/winstonlogger/winstonlogger.service';
import {AwsmqttService} from "./service/mqtt/awsmqtt.service";

@Module({
            imports: [forwardRef(() => DatabaseModule), HttpModule], // ✅ fixed
            controllers: [CommonController],
            providers: [CommonqueryService, CommonService, WinstonLoggerService, AwsmqttService],
            exports: [CommonqueryService, CommonService, WinstonLoggerService, AwsmqttService],
        })
export class CommonModule {

}