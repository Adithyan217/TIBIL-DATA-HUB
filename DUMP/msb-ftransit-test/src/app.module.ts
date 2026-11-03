import {MiddlewareConsumer , Module , NestModule , RequestMethod} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {ConfigModule , ConfigService} from '@nestjs/config';
import { UserModule } from './user/user.module';
import {AuthMiddleware} from 'dms-middleware-auth'
import { CacheModule  } from '@nestjs/cache-manager';
import {WinstonLoggerService} from "./user/services/winstonlogger/winstonlogger.service";


@Module({
          imports: [
            ConfigModule.forRoot({
             isGlobal: true,
             envFilePath: '.env', // ✅ Loads from .env
            }),
            UserModule,
            CacheModule.register(),
          ],
          controllers: [AppController],
          providers: [AppService, WinstonLoggerService,
              {
                  provide : 'AUTH_MIDDLEWARE_OPTIONS' ,
                  useFactory : (configService: ConfigService) => ({
                      publicKey : configService.get<string>( 'PUBLIC-TOKEN' ) ,
                      keycloakUrl : configService.get<string>( 'AXIOS-URL' ) ,
                      realm : configService.get<string>( 'REALMS' ) ,
                      clientId : configService.get<string>( 'CLIENT-ID' ) ,
                      clientSecret : configService.get<string>( 'CLIENT-SECRETS' ) ,
                      clientUuid : configService.get<string>( 'CLIENT-UUID' ) ,
                  }) ,
                  inject : [ConfigService] , // ✅ Inject `ConfigService` to dynamically load values
              }]
        })
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer?.apply(AuthMiddleware).exclude({ path: '/:params/ping', method: RequestMethod.ALL }).forRoutes('*')
    }
}