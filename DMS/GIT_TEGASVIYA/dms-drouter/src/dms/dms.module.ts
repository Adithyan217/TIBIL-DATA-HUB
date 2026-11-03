import { Module } from '@nestjs/common';
import { PnotifService } from './services/pnotif/pnotif.service';
import { PnotifController } from './controllers/pnotif/pnotif.controller';
import { DatabaseModule } from 'src/database/database.module';
import { pnotifQueryService } from './services/queries/pnotif-queries';
import { HttpModule } from '@nestjs/axios';
import {WorkerService} from './services/worker/worker.service'
import { MqttBrokerService } from './adapters/mqtt/mqtt.service';
import {RcacheService} from "./services/rcache/rcache.service";
import {DcacheService} from "./services/dcache/dcache.service";
import {CacheModule} from "@nestjs/cache-manager";
import { MqttHandlerService } from './adapters/mqtt/mqtt.handler.service';
import { MqttIotCoreService } from './adapters/mqtt_iot_core/mqtt_iot_core.service';
import { WinstonLoggerService } from './services/winstonlogger/winstonlogger.service';
import {DeviceService} from "./services/device/device.service";
import {DeviceQueryService} from "./services/queries/device-query";


@Module({
  imports: [DatabaseModule, HttpModule,  CacheModule.register()],
  controllers: [PnotifController],
  providers: [PnotifService, pnotifQueryService, WorkerService, MqttBrokerService,RcacheService, DcacheService, MqttHandlerService, MqttIotCoreService, WinstonLoggerService, DeviceService, DeviceQueryService  ],
  exports: [RcacheService, DcacheService, WorkerService, WinstonLoggerService]

})
export class DmsModule {}
