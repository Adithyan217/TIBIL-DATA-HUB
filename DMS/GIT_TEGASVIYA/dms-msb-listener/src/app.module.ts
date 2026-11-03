import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MqttSdkModule } from './mqtt_sdk/mqtt_sdk.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from '@nestjs/cache-manager';
import {AuthMiddleware } from 'dms-middleware-auth';
@Module({
  imports: [MqttSdkModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    CacheModule.register()
  ],
  controllers: [AppController ],
  providers: [AppService,
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
