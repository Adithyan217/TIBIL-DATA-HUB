import {Body , Controller , Get , Post , Req , Res} from '@nestjs/common';
import { Response } from 'express';
import { model } from '../../../models/interfaces/model.interface';
import { onboardModelService } from '../../../models/services/onboardmodel/onboardmodel.services';
import { CommonService } from '../../../common/service/common.service';
import {commonEnum} from "../../../common/enum/common.enum";
import { modelList } from '../../../firmwares/interfaces/entityList.interface';
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";

@Controller('registry')
export class modelController {

    constructor(
      private obs: onboardModelService,
      private commonService: CommonService, protected wl: WinstonLoggerService){}

    infoCommonLogger = (request) => {
        // this.wl.log(` ${request.method} ${request.url} -  Incoming request`);
    }
    errorCommonLogger = (request, error) => {
        // this.wl.error(` ${request.method} ${request.url} -  ${error}`);
    }
    @Get('models/ping')
    async ping(@Res() res: Response,@Req() req:any) {
        this.infoCommonLogger(req);
      res.status(200).send('OK');
    }

    @Post('models')
    async onboardMf(@Body() mdinfo:model, @Res() res: Response,@Req() req:any){
        try {
            this.infoCommonLogger(req);
            const result =  await this.obs.createModel(mdinfo)
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

        @Post('/models/details/get')
        async getEntity( @Body() body: modelList, @Res() res: Response,@Req() req:any){
            try{
                this.infoCommonLogger(req);
                body.offset = body.offset || 0;
                body.limit = body.limit || 10;
                if(!body?.mfid){
                  res.status(400).send({code: commonEnum.ERROR_CODE, message:commonEnum.FAILURE_MESSAGE})
                }else{
                  const exeRes = await  this.commonService.getEntityDetailsExecution(body, 'model')
                  return res.status(exeRes.status).send(exeRes.data);
                }
    
            }catch (error) {
                this.errorCommonLogger(req, error)
                return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

            }
        }
    }
  

