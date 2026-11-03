import {Body , Controller , Get , Post , Req , Res} from '@nestjs/common';
import { Response } from 'express';
import { vpa } from 'src/vpas/interfaces/vpa.interface';
import { onboardVpaService } from 'src/vpas/services/onboardvpa/onboardvpa.services';
import { CommonService } from 'src/common/service/common.service';
import {devicesMessage} from '../../../enums/devices.enums';
import { message } from 'src/enums/message';
import { commonEnum } from 'src/common/enum/common.enum';
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";
@Controller('registry')
export class vpaController {

    constructor(private obs: onboardVpaService,
      private commonService: CommonService, protected wl: WinstonLoggerService
    ){

    }
    infoCommonLogger = (request) => {
        // this.wl.log(` ${request.method} ${request.url} -  Incoming request`);
    }
    errorCommonLogger = (request, error) => {
        // this.wl.error(` ${request.method} ${request.url} -  ${error}`);
    }

    @Get('vpas/ping')
    async ping(@Res() res: Response,@Req() req:any) {
        this.infoCommonLogger(req);
      res.status(200).send('OK');
    }

    @Post('vpas')
    async onboardVpa(@Body() vinfo:vpa, @Res() res: Response,@Req() req:any){
        try {
            this.infoCommonLogger(req);
            const result =  await this.obs.createvpa(vinfo)
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


    @Post('/vpas/list/get')
    async getVpas(@Body() body: any, @Res() res: Response,@Req() req:any ) {
        try {
            this.infoCommonLogger(req);
            body.pagination.offset = body.pagination.offset || 0;
            body.pagination.limit = body.pagination.limit || 10;
            const result = await this.commonService.getVpasExecution( body );
            res.status( result.status).send(result.data);

        }
        catch (error) {
            this.errorCommonLogger(req, error)
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

        }
    }
    }
  

