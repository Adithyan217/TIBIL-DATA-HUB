import {Body, Controller, Get, Headers, Post, Req, Res} from '@nestjs/common';
import { Response } from 'express';
import { IHeader, logReq, pnotifBody } from 'src/dms/interfaces/route.interface';
import { PnotifService } from 'src/dms/services/pnotif/pnotif.service';
import { PnotifWalnutService } from 'src/dms/services/pnotif/pnotif_Walnut.service';
import {context, paymentStatus, paymentsMessage} from '../../../enums/payments_cache_status.enum';
import {executeProcessAndReturnResult} from '../../services/processor';
import { decryptData, encryptData } from 'src/dms/utils/encryptionUtils';

@Controller('soundbox')
export class PnotifController {
  constructor(private readonly pnotif: PnotifService,
  private readonly pnotifWalnut: PnotifWalnutService
  ) {}

  @Get('ping')
  async ping(@Res() res: Response) {
    res.status(200).send('OK');
  }

  @Post('pnotif')
  async create(
    @Headers() headers: IHeader,
    @Body() createRecord: pnotifBody,
    @Res() res: Response,
  ) {
    try {
      const device_id = headers?.did || 'NA';
      const context_ = headers?.context || 'NA';
      let result;
  
      if (context_ === 'walnut') {
        result = await this.pnotifWalnut.createpaymentRecordWalnut(createRecord, device_id, paymentStatus.RECEIVED, context.transaction);
      } else if (context_ === 'cwd') {
        result = await this.pnotif.createpaymentRecord(createRecord, device_id, paymentStatus.RECEIVED, context.transaction);
      } else {
        return res.status(400).json({ code: paymentsMessage.FAILURE_CODE, error: "Invalid context" });
      }
  
      if (result.code === paymentsMessage.SUCCESS_CODE) {
        return res.status(200).json(result);
      }
  
      return res.status(400).json(result);
    } catch (error) {
      return res.status(400).json({ code: paymentsMessage.FAILURE_CODE, error: paymentsMessage.FAILURE_MESSAGE });
    }
  }
  

  @Post('language')
  async getLanguage(
    @Headers() headers: IHeader,
    @Body() createRecord: pnotifBody,
    @Res() res: Response,
  ) {
    try {
      const device_id = headers?.did || 'NA';
      const result = await this.pnotif.createpaymentRecord(createRecord, device_id,  paymentStatus.RECEIVED, context.language);
      if (result.code === paymentsMessage.SUCCESS_CODE) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      return res.status(400).json({code: paymentsMessage.FAILURE_CODE, error:paymentsMessage.FAILURE_MESSAGE});
    }
  }




  @Post('/dlogs/get')
  async publishLogs(
    @Headers() headers: IHeader,
    @Body() createRecord: logReq,
    @Res() res: Response,
  ) {
    try {
      if(!createRecord?.request_id)
      {
        res.status(200).json({message: 'INVALID_REQUEST'})
      }
      const result = await this.pnotif.getLogsForReqId(createRecord?.request_id);
      if (result.code === paymentsMessage.SUCCESS_CODE) {
        return res.status(200).json(result);
      }

      return res.status(400).json(result);
    } catch (error) {
      return res.status(400).json({code: paymentsMessage.FAILURE_CODE, error:paymentsMessage.FAIL_LOG_MSG});
    }
  }



  @Post('/telemetry/get')
  async dlogs(
    @Body() createRecord: logReq,
    @Res() res: Response,
  ) {
    try {
      if(!createRecord?.device_id)
      {
        res.status(200).json({message: 'INVALID_REQUEST'})
      }
      const result = await this.pnotif.getTelemetryLogsForDid(createRecord?.device_id);
      if (result.code === paymentsMessage.SUCCESS_CODE) {
        return res.status(200).json(result);
      }

      return res.status(400).json(result);
    } catch (error) {
      return res.status(400).json({code: paymentsMessage.FAILURE_CODE, error:paymentsMessage.FAIL_LOG_MSG});
    }
  }


  // ------------------------------------------WALNUT--------------------------------------------



  @Post('settings')
  async walnutSettings(
    @Headers() headers: IHeader,
    @Body() createRecord: pnotifBody,
    @Res() res: Response,
  ) {
    try {
      const device_id = headers?.did || 'NA';
      const result = await this.pnotifWalnut.createpaymentRecordWalnut(createRecord, device_id,  paymentStatus.RECEIVED, context.settings);
      if (result.code === paymentsMessage.SUCCESS_CODE) {
        return res.status(200).json(result);
      }

      return res.status(400).json(result);
    } catch (error) {
      return res.status(400).json({code: paymentsMessage.FAILURE_CODE, error:paymentsMessage.FAILURE_MESSAGE});
    }
  }

  @Post('commands')
  async walnutCommands(
    @Headers() headers: IHeader,
    @Body() createRecord: pnotifBody,
    @Res() res: Response,
  ) {
    try {
      const device_id = headers?.did || 'NA';
      const result = await this.pnotifWalnut.createpaymentRecordWalnut(createRecord, device_id,  paymentStatus.RECEIVED, context.commands);
      if (result.code === paymentsMessage.SUCCESS_CODE) {
        return res.status(200).json(result);
      }

      return res.status(400).json(result);
    } catch (error) {
      return res.status(400).json({code: paymentsMessage.FAILURE_CODE, error:paymentsMessage.FAILURE_MESSAGE});
    }
  }

  @Post('walnutlogs/get')
  async walnutlogs(
    @Body() createRecord: logReq,
    @Res() res: Response,
  ) {
    try {
      if(!createRecord?.device_id)
      {
        res.status(200).json({message: 'INVALID_REQUEST'})
      }
      const result = await this.pnotif.getTelemetryLogsForDid(createRecord?.device_id);
      if (result.code === paymentsMessage.SUCCESS_CODE) {
        return res.status(200).json(result);
      }

      return res.status(400).json(result);
    } catch (error) {
      return res.status(400).json({code: paymentsMessage.FAILURE_CODE, error:paymentsMessage.FAIL_LOG_MSG});
    }
  }
}
