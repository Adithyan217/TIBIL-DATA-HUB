import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MqttSdkModule } from './mqtt_sdk/mqtt_sdk.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { LoadSecretsService } from './load-secret/load-secret.service';

@Module({
  imports: [MqttSdkModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule
  ],
  controllers: [AppController ],
  providers: [AppService, LoadSecretsService],
})
export class AppModule {}
