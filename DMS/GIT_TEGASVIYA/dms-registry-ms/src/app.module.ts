import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
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
import {ConfigModule , ConfigService} from '@nestjs/config';
import { CommonModule } from './common/common.module';
import {RouteModule} from "./routes/route.module";
import { DeviceRequestsModule } from './device_requests/device_requests.module';
import { DeviceIssuessModule } from './device_issues/device_issues.module';
import {AuthMiddleware } from 'dms-middleware-auth';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheModule } from '@nestjs/cache-manager';
import {CertificatesModule} from "./certificates/certificates.module";
import { simRequestsModule } from './sim/sim.module';

@Module({
  imports: [VpasModule, MerchantsModule, BanksModule, MfModule , BranchesModule, DevicesModule,
    SbModule, DatabaseModule, FirmwaresModule, ModelsModule, CommonModule,RouteModule,DeviceRequestsModule,DeviceIssuessModule, CertificatesModule,simRequestsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    CacheModule.register()


  ],
  controllers: [AppController],
          providers: [
            AppService,
            {
              provide: 'AUTH_MIDDLEWARE_OPTIONS',
              useFactory: (configService: ConfigService) => ({
                publicKey: configService.get<string>('PUBLIC-TOKEN'),
                keycloakUrl: configService.get<string>('AXIOS-URL'),
                realm: configService.get<string>('REALMS'),
                clientId: configService.get<string>('CLIENT-ID'),
                clientSecret: configService.get<string>('CLIENT-SECRETS'),
                clientUuid: configService.get<string>('CLIENT-UUID'),
              }),
              inject: [ConfigService], // ✅ Inject `ConfigService` to dynamically load values
            },

          ],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer?.apply(AuthMiddleware).exclude({ path: '/registry/:param/ping', method: RequestMethod.GET }, { path: '/registry/policies', method: RequestMethod.POST }, { path: '/certificate/:param', method: RequestMethod.GET } ).forRoutes('*')
  }
}
