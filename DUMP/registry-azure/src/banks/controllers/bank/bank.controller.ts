import {Body, Controller, Get, Param, Patch, Post, Req, Res} from '@nestjs/common';
import { Response } from 'express';
import { Bank } from 'src/banks/interfaces/bank.interface';
import { onboardBankService } from 'src/banks/services/onboardbank/onboardbank.service';
import {commonEnum} from "../../../common/enum/common.enum";
import { CommonService } from 'src/common/service/common.service';
import {updateEnum} from "../../../common/enum/update.enum";
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";
import {BanksService} from "../../services/banks/banks.service";

@Controller('registry')
export class BanksController {

    constructor(private obs: onboardBankService,
                private commonService: CommonService, protected wl:WinstonLoggerService, protected banksSerivce: BanksService
                ){

    }
     infoCommonLogger = (request ) => {
        // this.wl.log(` ${request.method} ${request.url} -  Incoming request`);
    }
    errorCommonLogger = (request, error) => {
        // this.wl.error(` ${request.method} ${request.url} -  ${error}`);
    }

    @Get('banks/ping')
    async ping(@Res() res: Response, @Req() req:any) {
        this.infoCommonLogger(req);
      res.status(200).send(`Registry-ms  operational. Version: ${process.env['MAJOR-VERSION']}.${process.env['MINOR-VERSION']}`);
    }

        @Post('banks')
        async onboardBank(@Body() binfo:Bank, @Req() req:any, @Res() res: Response){
            try {
                this.infoCommonLogger(req);
                const result =  await this.obs.createBank(binfo)
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


    @Post('/banks/details/get')
    async getEntity( @Body() body, @Res() res: Response, @Req() req: any ){
        try{
            this.infoCommonLogger(req);
            body["role"] = req?.user.role;
            body["userName"] = req?.user.userName;
            const exeRes = await  this.commonService.getEntityDetailsQueryExecution(body, 'bank')
            return res.status(exeRes.status).send(exeRes.data);
        }catch (error) {
            this.errorCommonLogger(req, error);
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

        }
    }

    @Post('/banks/list/get')
    async getBanks(@Body() body: any, @Res() res: Response, @Req() req: any ) {
        try {
            this.infoCommonLogger(req);
            body.pagination.offset = body.pagination.offset || 0;
            body.pagination.limit = body.pagination.limit || 10;
            body["role"] = req?.user.role;
            body["userName"] = req?.user.userName;
            const result = await this.commonService.getBanksExecution(body);
            res.status( result.status).send(result.data);
        }
            catch (error) {
            this.errorCommonLogger(req, error)
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

            }
    }

    @Post('/user/banks/get')
    async getUserByBanks(@Res() res: Response, @Req() req: any,  @Body() body:any ){
        try {
           const result:any =await this.banksSerivce.getBanksByUsers(body, req);
           res.status(result.status).send(result.data);
        }
        catch (error) {
            return res.status(error.statusCode || 500).send({message : error.message || 'An unexpected error occurred'} );
        }

    }


}



