import {Body , Controller , Get , Post , Req , Res} from '@nestjs/common';
import { Response } from 'express';
import { mf } from 'src/mf/interfaces/mf.interface';
import { onboardMfService } from 'src/mf/services/onboardmf/onboardmf.services';
import { CommonService } from 'src/common/service/common.service';
import {commonEnum} from "../../../common/enum/common.enum";
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";
import { GetmfService} from '../../services/getmf/getmf.service';
@Controller('registry')
export class mfController {

    constructor(private obs: onboardMfService,
                private  commonService: CommonService, protected wl:WinstonLoggerService, private getMf: GetmfService ){}

    infoCommonLogger = (request) => {
        // this.wl.log(` ${request.method} ${request.url} -  Incoming request`);
    }
    errorCommonLogger = (request, error) => {
        // this.wl.error(` ${request.method} ${request.url} -  ${error}`);
    }

    @Get('mf/ping')
    async ping(@Res() res: Response,@Req() req:any) {
        this.infoCommonLogger(req);
      res.status(200).send('OK');
    }

    @Post('mf')
    async onboardMf(@Body() mfinfo:mf, @Res() res: Response,@Req() req:any){
        try {
            this.infoCommonLogger(req);
            const result =  await this.obs.createmf(mfinfo)
            if(typeof result === 'object' && result?.code  === 200){
              res.status(201).send(result)
            }else{
              res.status(400).send(result)
            }
          
          } catch (error) {
            this.infoCommonLogger(req);
            return res.status(500).json({
              status: 500,
              message: 'Unable to create a record',
            });
          }
        }
    @Post('/mf/details/get')
    async getEntity( @Body() body, @Res() res: Response,@Req() req:any){
        try{
            this.infoCommonLogger(req);
            body.offset = body.offset || 0;
            body.limit = body.limit || 10;
            const exeRes = await  this.commonService.getEntityDetailsExecution(body, 'manufacturer')
            return res.status(exeRes.status).send(exeRes.data);

        }catch (error) {
            this.errorCommonLogger(req, error)
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

        }
    }
    @Post('mf/languages/get')
    async getMfLanguages( @Body() body, @Res() res: Response,@Req() req:any){
        try{

            const exeRes = await  this.getMf.getMfLanguages(body);
            return res.status(exeRes.status).send(exeRes.data);

        }catch (error) {
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

        }
    }
    }
  

