import { Module } from "@nestjs/common";
import { DatabaseModule } from "src/database/database.module";
import { RequestsController } from "./controllers/requests/requests.controller";
import { wfAgentService } from "./services/wfagent/wfagent.service";
import { wfEventsService } from "./services/wfevents/wfevents.service";
import { wfHandlerService } from "./services/wfhandler/wfhandler.service";
import { queryService } from "./services/query/query.service";
import { SchemaValidationService } from "./services/utils/validator.service";
import { HttpModule } from "@nestjs/axios";
import { WfalogService } from "./services/wfalog/wfalog.service";
import { WfhlogService } from "./services/wfhlog/wfhlog.service";
import { LoadSecretsService } from "src/load-secrets/load-secrets.service";
import { commonService } from "./services/common/common.service";
import {WinstonLoggerService} from './services/winstonlogger/winstonlogger.service';
@Module({
  imports: [DatabaseModule, HttpModule],
  providers: [
    wfAgentService,
    wfEventsService,
    wfHandlerService,
    queryService,
    SchemaValidationService,
    WfalogService,
    WfhlogService,
    LoadSecretsService,
    commonService,
      WinstonLoggerService
  ],
  controllers: [RequestsController],
  exports: [WinstonLoggerService]
})
export class RequestsModule {}
