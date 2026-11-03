import { Module } from '@nestjs/common';
import { ScheduleService } from './service/schedule.service';
import {PbacklogsService} from "../backlogs/services/pbacklogs.service";
import {DatabaseModule} from "../database/database.module";
import {BacklogsModule} from "../backlogs/backlogs.module";
import {DmsModule} from "../dms/dms.module";
import {PnotifService} from "../dms/services/pnotif/pnotif.service";
import {HttpModule} from "@nestjs/axios";
import {MqttHandlerService} from "../dms/adapters/mqtt/mqtt.handler.service";
import {MqttIotCoreService} from "../dms/adapters/mqtt_iot_core/mqtt_iot_core.service";
import {MqttBrokerService} from "../dms/adapters/mqtt/mqtt.service";

@Module({
imports: [DmsModule, HttpModule],
  providers: [ScheduleService, PbacklogsService, PnotifService, MqttHandlerService, MqttIotCoreService, MqttBrokerService,]
})
export class CronScheduleModule {}
