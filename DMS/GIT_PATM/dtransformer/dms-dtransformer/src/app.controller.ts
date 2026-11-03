import { Body, Controller, Get, Logger, Post, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/dms/ping')
  getHello(): string {
    return "OK";
  }

  @Post('/dms/sb-component')
  async callSbComponent(data:string){
    try {
     return {
        "data": "VSpCIOGSI3DX/16Os0QOaYdTBA4oZ9Sut+KELT4V1B/Xr60DQ3pnFnE81JKND0x8z5iLUoOyNzllRjNTijdTSclYiTtBVnjgkxDd8poWhGrjMzeIk8G0MUtwrQSu683Fpm+lNHjSODAKBuw7tek8eJZ03YU="
      }
      
    } catch (error) {
      Logger.error("Error occurred during calling SB component", error)
    }
  }

  @Post('/processed-data')
  async fetchTranformedResponse(@Res() res: Response, @Body() data: any){
    try {
     let resp = {
        "decrypted_request":{"reqRefNo": "1234", "amount": 100.00, "device_id": "1234"},
        "encrypted_response": {"data": "VSpCIOGSI3DX/16Os0QOaYdTBA4oZ9Sut+KELT4V1B/Xr60DQ3pnFnE81JKND0x8z5iLUoOyNzllRjNTijdTSclYiTtBVnjgkxDd8poWhGrjMzeIk8G0MUtwrQSu683Fpm+lNHjSODAKBuw7tek8eJZ03YU"},
        "mqtt_request":{"money": 100.00, "request_id": "1234"},
      }
      res.status(200).send(resp)
    } catch (error) {
      Logger.error("Error occurred during calling SB component", error)
    }
  }
}
