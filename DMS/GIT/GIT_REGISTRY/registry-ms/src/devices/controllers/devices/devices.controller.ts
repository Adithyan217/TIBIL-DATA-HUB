import {Body, Controller, Get, Post, Res,Patch} from '@nestjs/common';
import {Response} from 'express';
import { DevicePaymentInfo, Devices } from '../../interfaces/devices.interfaces';
import { onboardDevicesService } from 'src/devices/services/onboarddevices/onboarddevices.services';

import {devicesMessage, GeneralErrors} from '../../../enums/devices.enums';
import { CommonService } from 'src/common/service/common.service';
import { DeviceInfoService } from 'src/devices/services/device-info/device-info.service';

@Controller('registry')
export class devicesController {

    constructor(private obs: onboardDevicesService, private commonService: CommonService, private dinfoService: DeviceInfoService){}

    @Get('devices/ping')
    async ping(@Res() res: Response) {
      res.status(200).send('OK');
    }

    @Post('devices')
    async onboardDevices(@Body() dinfo:Devices, @Res() res: Response){
        try {
            const result =  await this.obs.createDevice(dinfo)
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
    @Post('/devices/list/get')
      async getDevices(@Body() body: any, @Res() res: Response ) {
        body.pagination.offset = body.pagination.offset || 0;
        body.pagination.limit = body.pagination.limit || 10;
        const result = await this.commonService.getDevicesExecution(body);
        res.status(result.code == devicesMessage.ERROR_CODE? 400 : 200).send(result);

    }
    @Post('/devices/details/get')
    async getDevicesDetails(@Body() body: any, @Res() res: Response ) {
        const result = await this.obs.getDevicesDetailsExecution(body);
        res.status(result.code == devicesMessage.ERROR_CODE? 400 : 200).send(result);

    }

    @Post('devices/payments/get')
    async getPaymentsForDevices(@Body() dinfo: DevicePaymentInfo, @Res() res: Response ) {
      try {
        let limit = dinfo.pagination.limit || 10;
        let offset = dinfo.pagination.offset || 0;
        let {device_id, from_date, to_date} = dinfo.filter;
        const result = await this.dinfoService.getPaymentsForDevices(device_id, from_date, to_date, limit, offset);
        res.status(result.code === devicesMessage.ERROR_CODE? 400 : 200).send(result);
     
      } catch (error) {
        res.status(devicesMessage.ERROR_CODE).send({code: GeneralErrors.SERVER_ERROR_CODE, message: GeneralErrors.SERVER_ERROR_MESSAGE});
      }
        

    }
  }
  

