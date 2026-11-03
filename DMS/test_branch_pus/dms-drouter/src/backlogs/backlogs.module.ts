import { Module } from '@nestjs/common';
import {PbacklogsService} from "./services/pbacklogs.service";
import {BacklogsController} from "./controller/backlogs.controller";
import {DmsModule} from "../dms/dms.module";
import {DatabaseModule} from "../database/database.module";
import {Cron} from "@nestjs/schedule";
import {CronScheduleModule} from "../schedule/schedule.module";
import {PnotifService} from "../dms/services/pnotif/pnotif.service";
import {pnotifQueryService} from "../dms/services/queries/pnotif-queries";
import {HttpModule } from "@nestjs/axios";
import {MqttHandlerService} from "../dms/adapters/mqtt/mqtt.handler.service";
import {MqttIotCoreService} from "../dms/adapters/mqtt_iot_core/mqtt_iot_core.service";
import {MqttBrokerService} from "../dms/adapters/mqtt/mqtt.service";

@Module({
    imports: [DmsModule, DatabaseModule, HttpModule],
    providers: [PbacklogsService, PnotifService, pnotifQueryService, MqttHandlerService, MqttIotCoreService, MqttBrokerService, ],
    controllers: [BacklogsController],
    exports:[PbacklogsService]
        })
export class BacklogsModule {

}
