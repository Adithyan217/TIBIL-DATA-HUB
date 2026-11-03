import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {ConfigModule , ConfigService} from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import {AuthMiddleware } from 'dms-middleware-auth';
import { LoadSecretsService } from './load-secrets/load-secrets.service';
import { WinstonLoggerService } from './winstonlogger/winstonlogger.service';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [DatabaseModule,
    ConfigModule.forRoot({ isGlobal: true}),

    
    CacheModule.register({
      isGlobal: true,
      ttl: 0
    })

  ],
  controllers: [AppController],
          providers: [
            AppService,LoadSecretsService, WinstonLoggerService,
            {
              provide: 'AUTH_MIDDLEWARE_OPTIONS',
              useFactory: (configService: ConfigService) => ({
                publicKey: configService.get<string>('PUBLIC_TOKEN'),
                keycloakUrl: configService.get<string>('AXIOS_URL'),
                realm: configService.get<string>('REALMS'),
                clientId: configService.get<string>('CLIENT_ID'),
                clientSecret: configService.get<string>('CLIENT_SECRETS'),
                clientUuid: configService.get<string>('CLIENT_UUID'),
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
