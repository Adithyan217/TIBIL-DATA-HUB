import { Module } from '@nestjs/common';
import { PnotifService } from './services/pnotif/pnotif.service';
import { PnotifController } from './controllers/pnotif/pnotif.controller';
import { DatabaseModule } from 'src/database/database.module';
import { pnotifQueryService } from './services/queries/pnotif-queries';
import { PnotifWalnutService } from './services/pnotif/pnotif_Walnut.service';
import { HttpModule } from '@nestjs/axios';
import {WorkerService} from './services/worker/worker.service'
import { MqttClientService } from './services/mqtt/mqtt.service';


@Module({
  imports: [DatabaseModule, HttpModule],
  controllers: [PnotifController],
  providers: [PnotifService, pnotifQueryService, WorkerService, MqttClientService, PnotifWalnutService ]

})
export class DmsModule {}
