import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { Merchant } from 'src/merchants/interfaces/merchant.interface';
import { onboardMerchantService } from 'src/merchants/services/onboardmerchants/onboardmerchant.services';
import { CommonService } from 'src/common/service/common.service';
import { commonEnum } from 'src/common/enum/common.enum';
import { devicesMessage } from 'src/enums/devices.enums';
@Controller('registry')
export class MerchantController {

    constructor(private obs: onboardMerchantService,
                private commonService: CommonService
    ){

    }

    @Get('merchants/ping')
    async ping(@Res() res: Response) {
      res.status(200).send('OK');
    }

    @Post('merchants')
    async onboardMerchant(@Body() minfo:Merchant, @Res() res: Response){
        try {
            const result =  await this.obs.createMerchant(minfo)
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

        @Post('/merchants/details/get')
        async getEntity( @Body() body, @Res() res: Response){
            try{
                body.offset = body.offset || 0;
                body.limit = body.limit || 10;
                const exeRes = await  this.commonService.getEntityDetailsExecution(body, 'merchant')
                res.status(exeRes.code == commonEnum.ERROR_CODE ? 400: 200).send(exeRes);
    
            }catch (e) {
                res.status(500).json({
                    status: commonEnum.ERROR_CODE,
                    message: e.message
                })
            }
        }
        @Post('/merchants/list/get')
        async getMerchants(@Body() body: any, @Res() res: Response ) {
          body.pagination.offset = body.pagination.offset || 0;
          body.pagination.limit = body.pagination.limit || 10;
          const result = await this.commonService.getMerchantsExecution(body);
          res.status(result.code == commonEnum.ERROR_CODE? 400 : 200).send(result);
  
      }
    }
  

