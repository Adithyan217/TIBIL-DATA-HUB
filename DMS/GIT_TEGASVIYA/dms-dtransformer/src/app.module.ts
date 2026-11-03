import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import {DmsModule} from "./dms/dms.module";
@Module({
  imports: [DmsModule,
    ConfigModule.forRoot({
       isGlobal: true,
       envFilePath: '.env', // ✅ Loads from .env
    }),

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
