import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import {ConfigModule , ConfigService} from '@nestjs/config';
import { IntelModule } from './intel/intel.module';
import { CacheModule } from '@nestjs/cache-manager';
import { RequestCounterMiddleware } from './middleware/cache.middleware';
import { IntelController } from './intel/controller/intel/intel.controller';
import {AuthMiddleware } from 'dms-middleware-auth';
import {WinstonLoggerService} from "./common/winstonlogger/winstonlogger.service";
import {AggregatorModule} from "./aggregator/aggregator.module";

@Module({
  imports: [DatabaseModule,
    ConfigModule.forRoot({ isGlobal: true}),
    AggregatorModule,
    IntelModule,
    CacheModule.register({
      isGlobal: true,
      ttl: 0
    })

  ],
  controllers: [AppController],
          providers: [
            AppService,WinstonLoggerService,
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
     consumer?.apply(AuthMiddleware).exclude({ path: '/:params/ping', method: RequestMethod.ALL }).forRoutes('*')
   }
}
