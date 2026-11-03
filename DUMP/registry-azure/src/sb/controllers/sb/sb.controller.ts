import {Body , Controller , Get , Param , Post , Req , Res} from '@nestjs/common';
import { Response } from 'express';
import { sb } from 'src/sb/interfaces/sb.interface';
import { createSbService } from 'src/sb/services/createsb/createsb.service';
import {commonEnum} from "../../../common/enum/common.enum";
import { CommonService } from 'src/common/service/common.service';
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";
@Controller('registry')
export class sbController {

    constructor(private obs: createSbService,
                private commonService: CommonService, protected wl: WinstonLoggerService){}

    infoCommonLogger = (request) => {
        // this.wl.log(` ${request.method} ${request.url} -  Incoming request`);
    }
    errorCommonLogger = (request, error) => {
        // this.wl.error(` ${request.method} ${request.url} -  ${error}`);
    }

    @Get('sb/ping')
    async ping(@Res() res: Response,@Req() req:any) {
        this.infoCommonLogger(req);
      res.status(200).send('OK');
    }

    @Post('sb/check')
    async checkapi( @Body() body, @Res() res: Response,@Req() req:any){
        try{
            this.infoCommonLogger(req);
            const exeRes = await  this.commonService.checkcvalues(body)
            res.status(exeRes.code == commonEnum.ERROR_CODE ? 400: 200).send(exeRes);

        }catch (e) {
            this.errorCommonLogger(req, e)
            res.status(500).json({
                status: commonEnum.ERROR_CODE,
                message: e.message
            })
        }
    }

        @Post('sb')
        async createSb(@Body() sbinfo:sb, @Res() res: Response,@Req() req:any){
            try {
                this.infoCommonLogger(req);
                const result =  await this.obs.createSb(sbinfo)
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


    @Post('/sb/get')
    async getEntity( @Body() body, @Res() res: Response,@Req() req:any){
        try{
            this.infoCommonLogger(req);
            body.offset = body.offset || 0;
            body.limit = body.limit || 10;
            const exeRes = await  this.commonService.getEntityDetailsExecution(body, 'sb')
            res.status(exeRes.status).send(exeRes.data);

        }catch (error) {
            this.errorCommonLogger(req, error);
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

        }
    }

    @Post('/sb/list/get')
    async getSoundboxes(@Body() body: any, @Res() res: Response, @Req() req:any ) {
        try {
            this.infoCommonLogger(req);
            body.pagination.offset = body.pagination.offset || 0;
            body.pagination.limit = body.pagination.limit || 10;
            body["role"] = req?.user.role;
            body["userName"] = req?.user.userName;
            const result = await this.commonService.getSoundboxesExecution( body );
            res.status( result.status ).send( result.data );
        }
        catch (error) {
            this.errorCommonLogger(req, error.messgae)
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

        }
    }

    @Post('/sb/connection')
    async connectSB(@Body() sbinfo:sb, @Res() res: Response,@Req() req:any){
        try {
            this.infoCommonLogger(req);
            const result =  await this.obs.connectSb(sbinfo)
            if(typeof result === 'object' && result?.code  === 200){
              res.status(201).send(result)
            }else{
              res.status(400).send(result)
            }

          } catch (error) {
            this.errorCommonLogger(req, error)
            return res.status(500).json({
              status: 500,
              message: 'Unable to connect soundbox',
            });
          }
    
    }
  
    @Post('/sb/pd/get')
    async getpd(@Body() body: any, @Res() res: Response, @Req() req:any ) {
        try {
            this.infoCommonLogger(req);
            // body.pagination.offset = body.pagination.offset || 0;
            // body.pagination.limit = body.pagination.limit || 10;
            const result = await this.commonService.getPdExecution( body );
            res.status( result.status ).send( result.data );
        }
        catch (error) {
            this.errorCommonLogger(req, error.messgae)
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

        }
    }

  }