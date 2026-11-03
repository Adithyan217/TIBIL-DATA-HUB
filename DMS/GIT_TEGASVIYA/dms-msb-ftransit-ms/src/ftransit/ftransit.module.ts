import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { WinstonLoggerService } from 'src/winstonlogger/winstonlogger.service';
import { FtransitController } from './controller/ftransit.controller';
import { OtpProviderService } from './services/otp-providers/otp-provider.service';
import { EmailOtpService } from './services/otp-providers/email-otp/email-otp.service';
import { FcmService } from './services/notification-provider/fcm/fcm.service';
import { NotificationProviderService } from './services/notification-provider/notification-provider.service';

@Module({
    imports:[forwardRef(() =>DatabaseModule ) ],
    providers: [ WinstonLoggerService, OtpProviderService, EmailOtpService,NotificationProviderService,FcmService],
    controllers:[FtransitController],
    exports: [WinstonLoggerService]
  })
export class FtransitModule {}
