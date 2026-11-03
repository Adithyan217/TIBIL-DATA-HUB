import {Body, Controller, Get, Param, Post, Res} from '@nestjs/common';
import { Response } from 'express';
import { sb } from 'src/sb/interfaces/sb.interface';
import { createSbService } from 'src/sb/services/createsb/createsb.service';
import {commonEnum} from "../../../common/enum/common.enum";
import { CommonService } from 'src/common/service/common.service';
@Controller('registry')
export class sbController {

    constructor(private obs: createSbService,
                private commonService: CommonService){

    }

    @Get('sb/ping')
    async ping(@Res() res: Response) {
      res.status(200).send('OK');
    }

    @Post('sb/check')
    async checkapi( @Body() body, @Res() res: Response){
        try{
            const exeRes = await  this.commonService.checkcvalues(body)
            res.status(exeRes.code == commonEnum.ERROR_CODE ? 400: 200).send(exeRes);

        }catch (e) {
            res.status(500).json({
                status: commonEnum.ERROR_CODE,
                message: e.message
            })
        }
    }

        @Post('sb')
        async createSb(@Body() sbinfo:sb, @Res() res: Response){
            try {
                const result =  await this.obs.createSb(sbinfo)
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


    @Post('/sb/get')
    async getEntity( @Body() body, @Res() res: Response){
        try{
            body.offset = body.offset || 0;
            body.limit = body.limit || 10;
            const exeRes = await  this.commonService.getEntityDetailsExecution(body, 'sb')
            res.status(exeRes.code == commonEnum.ERROR_CODE ? 400: 200).send(exeRes);

        }catch (e) {
            res.status(500).json({
                status: commonEnum.ERROR_CODE,
                message: e.message
            })
        }
    }
    }
  

