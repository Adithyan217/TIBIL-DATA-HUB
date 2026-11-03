import { Body, Controller, Get, HttpStatus, Inject, Post, Res ,Req } from '@nestjs/common';
import { Response } from 'express';
import { IntelService } from 'src/intel/services/intel/intel.service';
import { iEvent } from 'src/interface/iEvent';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ResponseCode } from 'src/intel/enums/response.enum';
import { Upermission } from 'src/interface/iEvent';
import {WinstonLoggerService} from "../../../common/winstonlogger/winstonlogger.service";
@Controller('intel')
export class IntelController {

    constructor(
        private iService: IntelService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache, protected wl:WinstonLoggerService
    ){}

    infoCommonLogger = (type , request, message) => {
        this.wl.log(`[${type}] ${request.method} ${request.url} ${message}`);
    }
    errorCommonLogger = (request, error) => {
        this.wl.error(`[RESPONSE]  ${request.method} ${request.url} -  ${error} `);
    }
 @Get("ping")
  async ping(@Res() res: Response, @Req() req:any) {
     // this.infoCommonLogger('REQUEST', req, "");
     // this.infoCommonLogger('RESPONSE', req,  `- status is 200`);
    res.status(200).send(`intel-ms operational version is: ${process.env.MAJOR_VERSION}.${process.env.MINOR_VERSION}`);
  }

  @Post('/metrics/get')
  async getMetric(@Body() edata: iEvent, @Res() res: Response,@Req() req:any){
    try {
        // this.infoCommonLogger('REQUEST', req, "");
      if(!edata.context){
        throw new Error('Context is required');
      }
      edata["role"] = req?.user.role;
      edata["userName"] = req?.user.userName;
      const result = await this.iService.getMetricsForContext(edata);
      // this.infoCommonLogger('RESPONSE', req,  `- status is ${result.status}`);
      res.status(result?.status).send(result.data);
    } catch (e) {
        // this.errorCommonLogger(req, ` status is ${e.statusCode || 500 }, ${e}` );

        res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
    }
    }

  @Post('/clear')
  async clearCache(@Res() res: Response, @Req() req ){
    try {
      // this.infoCommonLogger('REQUEST', req, "");
      await this.cacheManager.reset(); // Clears all keys in the cache
        // this.infoCommonLogger('RESPONSE', req,  `- status is ${HttpStatus.OK}`);
      res.status(HttpStatus.OK).send('Cache cleared successfully');
    } catch (e) {
      // this.errorCommonLogger(req, ` status is ${e.statusCode || 500 }, ${e}` );
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error clearing cache');
    }
  }

  @Post('user-permission')
  async addUpermissions(@Body() body:Upermission, @Res() res: Response, @Req() req ){
    try{
        // this.infoCommonLogger('REQUEST', req, "");

        const result =  await this.iService.addUserPermissions(body)
        // this.infoCommonLogger('RESPONSE', req,  `- status is ${result.status}`);
        return res.status(result.status).send(result.data);
        } catch (error) {
        // this.errorCommonLogger(req, ` status is ${error.statusCode || 500 }, ${error}` );
        return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );
    }
  }



}


