import {Body , Controller , Get , Post , Res , Patch , Req} from '@nestjs/common';
import {Response} from 'express';
import { SimRequest } from '../interfaces/sim.interfaces';
import { createSimRequests } from '../services/createsimrequests/createsimrequests.services';
import {WinstonLoggerService} from "../../common/service/winstonlogger/winstonlogger.service";


@Controller('registry')
export class simRequestsController {

    constructor(private cdi: createSimRequests, protected wl:WinstonLoggerService){}

    infoCommonLogger = (request) => {
        // this.wl.log(` ${request.method} ${request.url} -  Incoming request`);
    }
    errorCommonLogger = (request, error) => {
        // this.wl.error(` ${request.method} ${request.url} -  ${error}`);
    }

    @Get('device-issues/ping')
    async ping(@Res() res: Response,@Req() req:any) {
        this.infoCommonLogger(req);
      res.status(200).send('OK');
    }

    @Post('sim-requests')
    async onboardDevices(@Body() sinfo:SimRequest, @Res() res: Response,@Req() req:any){
        try {
            this.infoCommonLogger(req);
            const result =  await this.cdi.createSimRequests(sinfo)
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
    
  }
  

