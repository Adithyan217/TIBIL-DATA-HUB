import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { vpa } from 'src/vpas/interfaces/vpa.interface';
import { onboardVpaService } from 'src/vpas/services/onboardvpa/onboardvpa.services';
import { CommonService } from 'src/common/service/common.service';
import {devicesMessage} from '../../../enums/devices.enums';
import { message } from 'src/enums/message';
import { commonEnum } from 'src/common/enum/common.enum';
@Controller('registry')
export class vpaController {

    constructor(private obs: onboardVpaService,
      private commonService: CommonService
    ){

    }

    @Get('vpas/ping')
    async ping(@Res() res: Response) {
      res.status(200).send('OK');
    }

    @Post('vpas')
    async onboardVpa(@Body() vinfo:vpa, @Res() res: Response){
        try {
            const result =  await this.obs.createvpa(vinfo)
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


    @Post('/vpas/list/get')
    async getVpas(@Body() body: any, @Res() res: Response ) {
        body.pagination.offset = body.pagination.offset || 0;
        body.pagination.limit = body.pagination.limit || 10;
        const result = await this.commonService.getVpasExecution(body);
        res.status(result.code == commonEnum.ERROR_CODE? 400 : 200).send(result);

    }

    }
  

