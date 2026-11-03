import { Module } from '@nestjs/common';
import { WinstonLoggerService } from './winstonlogger.service';

@Module({
  providers: [WinstonLoggerService],
  exports: [WinstonLoggerService],
})
export class WinstonLoggerModule {}
