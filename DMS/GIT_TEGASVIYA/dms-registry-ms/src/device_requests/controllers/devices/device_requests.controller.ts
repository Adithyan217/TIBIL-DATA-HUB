import {Body , Controller , Get , Post , Res , Patch , Req} from '@nestjs/common';
import {Response} from 'express';
import { DeviceRequest } from '../../interfaces/device_requests.interfaces';
import { creatDeviceRequests } from '../../services/createdevicerequests/createdevicerequests.services';

import {deviceRequestMessage, GeneralErrors} from '../../../enums/device_request.enum';
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";

@Controller('registry')
export class deviceRequestsController {

    constructor(private cdr: creatDeviceRequests, protected wl: WinstonLoggerService){}

    infoCommonLogger = (request) => {
        // this.wl.log(` ${request.method} ${request.url} -  Incoming request`);
    }
    errorCommonLogger = (request, error) => {
        // this.wl.error(` ${request.method} ${request.url} -  ${error}`);
    }

    @Get('device-requests/ping')
    async ping(@Res() res: Response ,@Req() req:any) {
        this.infoCommonLogger(req);
      res.status(200).send('OK');
    }

    @Post('device-requests')
    async onboardDevices(@Body() dinfo:DeviceRequest, @Res() res: Response,@Req() req:any){
        try {
            this.infoCommonLogger(req);
            const result =  await this.cdr.createDeviceRequests(dinfo)
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
  

