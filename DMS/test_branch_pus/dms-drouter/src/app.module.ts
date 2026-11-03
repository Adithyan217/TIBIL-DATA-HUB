import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DmsModule } from './dms/dms.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { LoadSecretsService } from './load-secret/load-secret.service';
import {BacklogsModule} from "./backlogs/backlogs.module";
import { CronScheduleModule } from './schedule/schedule.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register(),
    DmsModule,
    DatabaseModule,
    BacklogsModule,
    ScheduleModule.forRoot(),
      CronScheduleModule
    
  ],
  controllers: [AppController],
  providers: [AppService, LoadSecretsService],
})
export class AppModule {}
