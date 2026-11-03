import {Body, Controller, Get, Headers, Param, Post, Req, Res} from '@nestjs/common';
import { Request, Response } from 'express';
import { IHeader, pnotifBody } from 'src/dms/interfaces/route.interface';
import { PnotifService } from 'src/dms/services/pnotif/pnotif.service';
import {switch_drouter_msg, paymentsMessage} from '../../../enums/payments_cache_status.enum';
import { symDecryptor } from 'src/dms/utils/decryptionUtils';
import { symEncryptor } from 'src/dms/utils/encryptionUtils';
import { WinstonLoggerService } from 'src/dms/services/winstonlogger/winstonlogger.service';
import * as util from 'util';
import {DeviceService} from "../../services/device/device.service";

@Controller('drouter')
export class PnotifController {
  constructor(private readonly pnotif: PnotifService, private wslogService:WinstonLoggerService, private deviceService: DeviceService) {}

  @Get('ping')
  async ping(@Res() res: Response) {
    res.status(200).send(`dRouter-ms  operational. Version: ${process.env.MAJOR_VERSION}.${process.env.MINOR_VERSION}`);
  }

  // @Post('pnotif/:context')
   @Post('pnotif')
  async create(
    @Req() Request: Request,
    @Headers() headers: IHeader,
    @Body() createRecord: pnotifBody,
    @Res() res: Response,
  ) {
    try {
      const ifsc = headers?.ifsc;
      const did = headers?.did;
      const key = headers?.key;
      if(!did){
        this.wslogService.error('Device ID is missing');
        throw new Error('Device ID is missing');
      }
      const result = await this.pnotif.createRouteWorkflow(createRecord.data,ifsc, did, key, switch_drouter_msg.RECEIVED);
      if (result.code === paymentsMessage.SUCCESS_CODE) {
        return res.status(200).json({ data: result?.message });
      }
      return res.status(400).json({
        "data":result?.message
      });
    } catch (error) {
      return res.status(400).json({
        "statMsg": "Failed to Insert",
        "reqRefNo": "",
        "statCode": "F"
      });
    }
  }

  @Get('records')
  async getRecords(@Res() res: Response) {
    try {
      const result = await this.pnotif.getPaymentRecords();
      if (result?.code == 200) {
        return res.status(200).json({
          status: 200,
          data: result?.data,
        });
      } else {
        return res.status(400).json({
          status: 400,
          message: 'Payment record not found',
        });
      }
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: 'Unable to find a record',
      });
    }
  }
  @Post('/device/deactivation')
  async deviceDeactivations(@Res() res: Response, @Req() Request: Request, @Body() body:any ) {
      try{

        const result = await this.deviceService.deviceDeactivations(body);
        res.status(result.status).send(result.data);

      }catch (e) {
        return res.status(500).json({status: 5000,
                                     message: e.message,
                                    });
      }
  }
  @Post('/sb')
  async InsertIntoSb(@Res() res: Response, @Req() Request: Request, @Body() body:any ) {
    try{

      const result = await this.deviceService.insertIntoSoundbox(body);
      res.status(result.status).send(result.data);

    }catch (e) {
      return res.status(500).json({status: 5000,
                                    message: e.message,
                                  });
    }

  }
}



