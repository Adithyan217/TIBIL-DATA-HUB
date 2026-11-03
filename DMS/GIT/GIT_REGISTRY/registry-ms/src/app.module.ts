import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VpasModule } from './vpas/vpas.module';
import { MerchantsModule } from './merchants/merchants.module';
import { BanksModule } from './banks/banks.module';
import { MfModule } from './mf/mf.module';
import { BranchesModule } from './branches/branches.module';
import { DevicesModule } from './devices/devices.module';
import {FirmwaresModule} from './firmwares/firmwares.module';
import {ModelsModule} from './models/model.module';
import { SbModule } from './sb/sb.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { commonModule } from './common/common.module';
import {RouteModule} from "./routes/route.module";
import { DeviceRequestsModule } from './device_requests/device_requests.module';
@Module({
  imports: [VpasModule, MerchantsModule, BanksModule, MfModule , BranchesModule, DevicesModule,
    SbModule, DatabaseModule, FirmwaresModule, ModelsModule, commonModule,RouteModule,DeviceRequestsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),

  
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {

}
