import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { OtpProviderService } from '../services/otp-providers/otp-provider.service';
import { NotificationProviderService } from '../services/notification-provider/notification-provider.service';

@Controller('ftransit')
export class FtransitController {

    constructor(private otpService: OtpProviderService, private nfs: NotificationProviderService){}
    @Get("ping")
  async ping(@Res() res: Response, @Req() req:any) {
     // this.infoCommonLogger('REQUEST', req, "");
     // this.infoCommonLogger('RESPONSE', req,  `- status is 200`);
    res.status(200).send(`ftransit-ms operational version is: ${process.env.MAJOR_VERSION}.${process.env.MINOR_VERSION}`);
  }

  @Post('/otp')
  async initiateOtp(@Body() edata: any, @Res() res: Response,@Req() req:any){
    try {
        // this.infoCommonLogger('REQUEST', req, "");
      if(!edata.ftype){
        throw new Error('ftype is required');
      }
    const result = await this.otpService.extractAndRouteToOtpProvider(edata);
      res.status(result?.status).send(result.data);
    } catch (e) {
        // this.errorCommonLogger(req, ` status is ${e.statusCode || 500 }, ${e}` );

        res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
    }
    }

    @Post('/notification')
    async initiateNotification(@Body() edata: any, @Res() res: Response,@Req() req:any){
      try {
        
      const result = await this.nfs.identifyNotificationRoute(edata);
        res.status(result?.status).send(result.data);
      } catch (e) {
          // this.errorCommonLogger(req, ` status is ${e.statusCode || 500 }, ${e}` );
  
          res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
      }
      }
}
