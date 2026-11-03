import {Body, Controller, Get, Headers, Post, Req, Res} from '@nestjs/common';
import { Response } from 'express';
import { IHeader, pnotifBody } from 'src/dms/interfaces/route.interface';
import { PnotifService } from 'src/dms/services/pnotif/pnotif.service';
import {switch_drouter_msg, paymentsMessage} from '../../../enums/payments_cache_status.enum';
import { symDecryptor } from 'src/dms/utils/decryptionUtils';
import { symEncryptor } from 'src/dms/utils/encryptionUtils';
@Controller('drouter')
export class PnotifController {
  constructor(private readonly pnotif: PnotifService) {}

  @Get('ping')
  async ping(@Res() res: Response) {
    res.status(200).send('Drouter OK');
  }

  @Post('pnotif')
  async create(
    @Headers() headers: IHeader,
    @Body() createRecord: pnotifBody,
    @Res() res: Response,
  ) {
    try {
      const ifsc = headers?.ifsc || 'NA';
      const did = headers?.did || 'NA';
      const key = headers?.key || 'NA'; 
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
}



