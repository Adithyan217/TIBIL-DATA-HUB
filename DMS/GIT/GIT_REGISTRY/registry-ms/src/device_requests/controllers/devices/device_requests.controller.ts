import {Body, Controller, Get, Post, Res,Patch} from '@nestjs/common';
import {Response} from 'express';
import { DeviceRequest } from '../../interfaces/device_requests.interfaces';
import { creatDeviceRequests } from '../../services/createdevicerequests/createdevicerequests.services';

import {deviceRequestMessage, GeneralErrors} from '../../../enums/device_request.enum';

@Controller('registry')
export class deviceRequestsController {

    constructor(private cdr: creatDeviceRequests){}

    @Get('device-requests/ping')
    async ping(@Res() res: Response) {
      res.status(200).send('OK');
    }

    @Post('device-requests')
    async onboardDevices(@Body() dinfo:DeviceRequest, @Res() res: Response){
        try {
            const result =  await this.cdr.createDeviceRequests(dinfo)
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
    
  }
  

