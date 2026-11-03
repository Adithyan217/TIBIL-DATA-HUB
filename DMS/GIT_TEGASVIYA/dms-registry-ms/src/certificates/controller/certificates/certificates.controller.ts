import { Controller, Get, Param, Res, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { CertificatesService } from '../../services/certificates/certificates.service';


@Controller('certificate')
export class CertificatesController {
    constructor(private readonly certificatesService: CertificatesService) {}

    @Get(':deviceId')
    async getCertificate(@Param('deviceId') deviceId: string, @Res() res: Response) {
        if (!deviceId) {
            return res.status(HttpStatus.BAD_REQUEST).json({ error: 'deviceId is required' });
        }
        try {
            const result = await this.certificatesService.getDeviceCertificates(deviceId);
            return res.status(HttpStatus.OK).json(result);
        } catch (error: any) {

            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message || 'Internal Server Error' });
        }
    }
}
