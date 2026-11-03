import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DmsModule } from './dms/dms.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { LoadSecretsService } from './load-secret/load-secret.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register(),
    DmsModule,
    DatabaseModule,
    
  ],
  controllers: [AppController],
  providers: [AppService, LoadSecretsService],
})
export class AppModule {}
