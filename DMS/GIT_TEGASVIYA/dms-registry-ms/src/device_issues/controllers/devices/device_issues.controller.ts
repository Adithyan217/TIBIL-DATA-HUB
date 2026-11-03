import {Body , Controller , Get , Post , Res , Patch , Req} from '@nestjs/common';
import {Response} from 'express';
import { DeviceIssue } from '../../interfaces/device_issues.interfaces';
import { creatDeviceIssues } from '../../services/createdeviceissues/createdeviceissues.services';
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";


@Controller('registry')
export class deviceIssuessController {

    constructor(private cdi: creatDeviceIssues, protected wl:WinstonLoggerService){}

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

    @Post('device-issues')
    async onboardDevices(@Body() dinfo:DeviceIssue, @Res() res: Response,@Req() req:any){
        try {
            this.infoCommonLogger(req);
            const result =  await this.cdi.createDeviceIssues(dinfo)
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
  

