import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { AppService } from './app.service';
import onboard_merchant from './schemas/merchants/merchant';
import { Response } from 'express';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('validate')
  async validateData(@Body() data: any, @Res() res: Response) {
    const result = await this.appService.ajvValidator(onboard_merchant,data)
    if(result.errors){
       res.status(400).json({code: 400, error: result.errors})
    }else{
      res.status(200).send({code:200, message:"Ajv validation successful"})
    }
  }
}
