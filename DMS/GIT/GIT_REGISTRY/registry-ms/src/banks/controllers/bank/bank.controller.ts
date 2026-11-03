import {Body, Controller, Get, Param, Patch, Post, Res} from '@nestjs/common';
import { Response } from 'express';
import { Bank } from 'src/banks/interfaces/bank.interface';
import { onboardBankService } from 'src/banks/services/onboardbank/onboardbank.service';
import {commonEnum} from "../../../common/enum/common.enum";
import { CommonService } from 'src/common/service/common.service';
import {updateEnum} from "../../../common/enum/update.enum";

@Controller('registry')
export class BanksController {

    constructor(private obs: onboardBankService,
                private commonService: CommonService
                ){

    }
    
    @Get('banks/ping')
    async ping(@Res() res: Response) {
      res.status(200).send('OK');
    }

        @Post('banks')
        async onboardBank(@Body() binfo:Bank, @Res() res: Response){
            try {
                const result =  await this.obs.createBank(binfo)
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


    @Post('/banks/details/get')
    async getEntity( @Body() body, @Res() res: Response){
        try{
            body.offset = body.offset || 0;
            body.limit = body.limit || 10;
            const exeRes = await  this.commonService.getEntityDetailsExecution(body, 'bank')
            res.status(exeRes.code == commonEnum.ERROR_CODE ? 400: 200).send(exeRes);

        }catch (e) {
            res.status(500).json({
                status: commonEnum.ERROR_CODE,
                message: e.message
            })
        }
    }

    @Post('/banks/list/get')
    async getBanks(@Body() body: any, @Res() res: Response ) {
        body.pagination.offset = body.pagination.offset || 0;
        body.pagination.limit = body.pagination.limit || 10;
        const result = await this.commonService.getBanksExecution(body);
        res.status(result.code == commonEnum.ERROR_CODE? 400 : 200).send(result);

    }
   
}


