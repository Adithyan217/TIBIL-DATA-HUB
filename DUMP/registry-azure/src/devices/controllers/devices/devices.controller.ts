import {Body, Controller, Get, Post, Res,Patch, Req} from '@nestjs/common';
import {Response} from 'express';
import { DevicePaymentInfo, Devices, msbDevices } from '../../interfaces/devices.interfaces';
import { onboardDevicesService } from 'src/devices/services/onboarddevices/onboarddevices.services';
import { PatchdeviceService } from 'src/devices/services/patchdevice/patchdevice.service';
import {devicesMessage, GeneralErrors} from '../../../enums/devices.enums';
import { commonEnum } from 'src/common/enum/common.enum';
import { CommonService } from 'src/common/service/common.service';
import { DeviceInfoService } from 'src/devices/services/device-info/device-info.service';
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";
import {error} from "winston";
import { onboardMsbDevicesService } from 'src/devices/services/onboarddevices/onboardmsbdevices.services';

@Controller('registry')
export class devicesController {

    constructor(private obs: onboardDevicesService,
                private commonService: CommonService,
                private msbService: onboardMsbDevicesService,
                private dinfoService: DeviceInfoService,
                protected wl:WinstonLoggerService,
                private ps: PatchdeviceService){}

    infoCommonLogger = (request) => {
        // this.wl.log(` ${request.method} ${request.url} -  Incoming request`);
    }
    errorCommonLogger = (request, error) => {
        // this.wl.error(` ${request.method} ${request.url} -  ${error}`);
    }
    @Get('devices/ping')
    async ping(@Res() res: Response,@Req() req:any) {
        this.infoCommonLogger(req);
      res.status(200).send('OK');
    }

    @Post('devices')
    async onboardDevices(@Body() dinfo:Devices | msbDevices, @Res() res: Response,@Req() req:any){
        try {
            this.infoCommonLogger(req);
            let result;
            if(dinfo?.edetails[0]?.dtype === 'MSB'){
             result =  await this.msbService.createMsbDevice(dinfo)
            }else if(dinfo?.edetails[0]?.dtype === 'STD'){
               result =  await this.obs.createDevice(dinfo)
            }
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
    @Post('/devices/list/get')
      async getDevices(@Body() body: any, @Res() res: Response, @Req() req:any ) {
        try {
            this.infoCommonLogger(req);
            body.pagination.offset = body.pagination.offset || 0;
            body.pagination.limit = body.pagination.limit || 10;
            body["role"] = req?.user.role;
            body["userName"] = req?.user.userName;
            const result = await this.commonService.getDevicesExecution( body );
            res.status( result.status ).send( result.data );
        }
        catch (error) {
            this.errorCommonLogger(req, error.messgae)
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

        }
    }
    // @Post('/devices/details/get')
    // async getDevicesDetails(@Body() body: any, @Res() res: Response, @Req() req:any ) {
    //     body["role"] = req?.user.role;
    //     body["userName"] = req?.user.userName;
    //     const result = await this.obs.getDevicesDetailsExecution(body);
    //     res.status(result.code == devicesMessage.ERROR_CODE? 400 : 200).send(result);

    // }

    @Post('/devices/details/get')
    async getDevicesDetails(@Body() body: any, @Res() res: Response, @Req() req:any ) {
        try {
            this.infoCommonLogger(req);
            body["role"] = req?.user.role;
            body["userName"] = req?.user.userName;
            const result = await this.commonService.getEntityDetailsQueryExecution( body , 'device' );
            res.status( result.status ).send( result.data );
        }
        catch (error) {
            this.errorCommonLogger(req, error.messgae)
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );
        }
    }

    @Post('devices/payments/get')
    async getPaymentsForDevices(@Body() dinfo: any, @Res() res: Response , @Req() req:any ) {
      try { this.infoCommonLogger(req);
        let limit = dinfo.pagination.limit || 10;
        let offset = dinfo.pagination.offset || 0;
        let {device_id, from_date, to_date} = dinfo.filter;
        dinfo["role"] = req?.user.role;
        dinfo["userName"] = req?.user.userName;
        const result = await this.dinfoService.getPaymentsForDevices(device_id, from_date, to_date, limit, offset,dinfo.userName,dinfo.role);
        return res.status(result.status).send(result.data);
     
      } catch (error) {
          this.errorCommonLogger(req, error)
          return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );
      }
    }

    @Post('/devices/telemetry/get')
    async getDevicesTelemetry(@Body() body: any, @Res() res: Response, @Req() req:any ) {
        try {

            body["role"] = req?.user.role;
            body["userName"] = req?.user.userName;
            const result = await this.dinfoService.getTelemetryDetails( body );
            res.status( result.status).send( result.data);
        }catch (error) {
            this.errorCommonLogger(req, error);
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

        }
    }

    @Post('soundboxes')
    async enableSoundboxes(@Body() body: any, @Res() res: Response, @Req() req:any ){
        try {
            this.infoCommonLogger(req);
            const result = await this.obs.enableSoundbox( body );
            res.status(result.status).send( result.data);
        }
        catch (error) {
            this.errorCommonLogger(req, error)
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

        }
    }

    @Patch('devices')
    async updateDevice(@Body() body: any, @Res() res: Response, @Req() req:any ){
        try{
            this.infoCommonLogger(req);
            const result = await this.ps.updateDevice( body );
            res.status(result.status).send( result.data);
        }
        catch (e) {
            this.errorCommonLogger(req, e)
            return res.status( e.statusCode || 500 ).send( {message : e.message || 'An unexpected error occurred'} );

        }
    }

    @Post('devices/transactions/simulate')
    async testPayment(@Body() body: any, @Res() res: Response, @Req() req:any ){
        try {
            this.infoCommonLogger(req);
            const result = await this.ps.simulatePayments( body );
            res.status(result.status).send( result.data);
        }
        catch (error) {
            this.errorCommonLogger(req, error)
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

        }
    }
    

  }
  

