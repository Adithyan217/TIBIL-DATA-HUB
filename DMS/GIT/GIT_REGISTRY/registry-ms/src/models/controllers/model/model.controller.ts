import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { model } from 'src/models/interfaces/model.interface';
import { onboardModelService } from 'src/models/services/onboardmodel/onboardmodel.services';
import { message } from 'src/enums/message';
import { CommonService } from 'src/common/service/common.service';
import {commonEnum} from "src/common/enum/common.enum";
import { modelList } from 'src/firmwares/interfaces/entityList.interface';

@Controller('registry')
export class modelController {

    constructor(
      private obs: onboardModelService,
      private commonService: CommonService){

    }

    @Get('models/ping')
    async ping(@Res() res: Response) {
      res.status(200).send('OK');
    }

    @Post('models')
    async onboardMf(@Body() mdinfo:model, @Res() res: Response){
        try {
            const result =  await this.obs.createModel(mdinfo)
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

        @Post('/models/details/get')
        async getEntity( @Body() body: modelList, @Res() res: Response){
            try{
                body.offset = body.offset || 0;
                body.limit = body.limit || 10;
                if(!body?.mfid){
                  res.status(400).send({code: commonEnum.ERROR_CODE, message:commonEnum.FAILURE_MESSAGE})
                }else{
                  const exeRes = await  this.commonService.getEntityDetailsExecution(body, 'model')
                  return res.status(exeRes.code == commonEnum.ERROR_CODE ? 400: 200).send(exeRes);
                }
    
            }catch (e) {
                res.status(500).json({
                    status: commonEnum.ERROR_CODE,
                    message: e.message
                })
            }
        }
    }
  

