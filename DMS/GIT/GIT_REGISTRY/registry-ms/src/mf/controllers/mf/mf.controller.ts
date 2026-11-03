import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { mf } from 'src/mf/interfaces/mf.interface';
import { onboardMfService } from 'src/mf/services/onboardmf/onboardmf.services';
import { CommonService } from 'src/common/service/common.service';
import {commonEnum} from "../../../common/enum/common.enum";
@Controller('registry')
export class mfController {

    constructor(private obs: onboardMfService,
                private  commonService: CommonService){

    }

    @Get('mf/ping')
    async ping(@Res() res: Response) {
      res.status(200).send('OK');
    }

    @Post('mf')
    async onboardMf(@Body() mfinfo:mf, @Res() res: Response){
        try {
            const result =  await this.obs.createmf(mfinfo)
            if(typeof result === 'object' && result?.code  === 200){
              res.status(201).send(result)
            }else{
              res.status(400).send(result)
            }
          
          } catch (error) {
            return res.status(500).json({
              status: 500,
              message: 'Unable to create a record',
            });
          }
        }
    @Post('/mf/details/get')
    async getEntity( @Body() body, @Res() res: Response){
        try{
            body.offset = body.offset || 0;
            body.limit = body.limit || 10;
            const exeRes = await  this.commonService.getEntityDetailsExecution(body, 'manufacturer')
            res.status(exeRes.code == commonEnum.ERROR_CODE ? 400: 200).send(exeRes);

        }catch (e) {
            res.status(500).json({
                status: commonEnum.ERROR_CODE,
                message: e.message
            })
        }
    }
    }
  

