import {Body , Controller , Get , Post , Req , Res} from '@nestjs/common';
import { Response } from 'express';
import { Merchant } from '../../interfaces/merchant.interface';
import { onboardMerchantService } from '../../services/onboardmerchants/onboardmerchant.services';
import { CommonService } from '../../../common/service/common.service';
import { commonEnum } from '../../../common/enum/common.enum';
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";

@Controller('registry')
export class MerchantController {

    constructor(private obs: onboardMerchantService,
                private commonService: CommonService, protected wl:WinstonLoggerService){}

    infoCommonLogger = (request) => {
        // this.wl.log(` ${request.method} ${request.url} -  Incoming request`);
    }
    errorCommonLogger = (request, error) => {
        // this.wl.error(` ${request.method} ${request.url} -  ${error}`);
    }

    @Get('merchants/ping')
    async ping(@Res() res: Response,@Req() req:any) {
        this.infoCommonLogger(req);
      res.status(200).send('OK');
    }

    @Post('merchants')
    async onboardMerchant(@Body() minfo:Merchant, @Res() res: Response,@Req() req:any){
        try {
            this.infoCommonLogger(req);
            const result =  await this.obs.createMerchant(minfo)
            if(typeof result === 'object' && result?.code  === 200){
              res.status(201).send(result)
            }else{
              res.status(400).send(result)
            }
          
          } catch (error) {
            this.errorCommonLogger(req, error)
            return res.status(500).json({
              status: 500,
              message: 'Unable to create a record',
            });
          }
        }

        @Post('/merchants/details/get')
        async getEntity( @Body() body, @Res() res: Response,@Req() req:any){
            try{ this.infoCommonLogger(req);
                body.offset = body.offset || 0;
                body.limit = body.limit || 10;
                const exeRes = await  this.commonService.getEntityDetailsExecution(body, 'merchant')
                res.status(exeRes.status).send(exeRes.data);
    
            }catch (error) {
                this.errorCommonLogger(req, error);
                return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );
            }
        }
        @Post('/merchants/list/get')
        async getMerchants(@Body() body: any, @Res() res: Response,@Req() req:any ) {
        try {
            this.infoCommonLogger(req);
            body.pagination.offset = body.pagination.offset || 0;
            body.pagination.limit = body.pagination.limit || 10;
            body["role"] = req?.user.role;
            body["userName"] = req?.user.userName;
            const result = await this.commonService.getMerchantsExecution( body );
           return res.status( result.status ).send( result.data );
        }catch (error) {
            this.errorCommonLogger(req, error)
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

        }
      }
    }
  

