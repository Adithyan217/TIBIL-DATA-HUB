import { Module } from '@nestjs/common';
import { CertificatesService } from './services/certificates/certificates.service';
import {CertificatesController} from './controller/certificates/certificates.controller'
import {WinstonLoggerService} from "../common/service/winstonlogger/winstonlogger.service";
@Module({
            providers: [CertificatesService, WinstonLoggerService],
            controllers: [CertificatesController],
        })
export class CertificatesModule {}
