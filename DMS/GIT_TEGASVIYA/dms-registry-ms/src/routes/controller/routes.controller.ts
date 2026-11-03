import {Body , Controller , Post , Req , Res} from '@nestjs/common';
import {RoutesService} from "../services/routes.service";
import {commonEnum} from '../../common/enum/common.enum';
import {response} from '../../common/interface/common.interface';
import {Response} from "express";
import { Routes } from '../interfaces/routes.interface';
import {WinstonLoggerService} from "../../common/service/winstonlogger/winstonlogger.service";
@Controller('registry')
export class RoutesController {
    constructor(private routesService: RoutesService, protected wl: WinstonLoggerService) {}

    infoCommonLogger = (request) => {
        // this.wl.log(` ${request.method} ${request.url} -  Incoming request`);
    }
    errorCommonLogger = (request, error) => {
        // this.wl.error(` ${request.method} ${request.url} -  ${error}`);
    }

    @Post('/droutes/get')
    async getRouteDevices(@Res() res : Response, @Body() body: {did: number},@Req() req:any) {
        try {
            this.infoCommonLogger(req);
            const result = await this.routesService.ExecuteGetDevicesQueryAndReturnResult( body?.did );
            res.status( result.status ).send( result.code );
        }
        catch (error) {
            this.errorCommonLogger(req, error);
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

        }
    }

    @Post('/routes/config/get')
    async getRoutesConfig(@Res() res : Response,@Req() req:any) {
        try {
            this.infoCommonLogger(req);
            const result = await this.routesService.ExecuteRouteConfigQueryAndReturnResult();
            res.status( result.status ).send( result.code );
        } catch (error) {
            this.errorCommonLogger(req, error)
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );
        }
    }

    @Post('/routes/get')
    async getRoutes(@Body() rinfo: Routes, @Res() res: Response,@Req() req:any) {
        try {
            this.infoCommonLogger(req);
            const result = await this.routesService.ExecuteRouteQueryAndReturnResult(rinfo);
            return res.status(result.status).send(result.data);
           } catch (error) {
            this.errorCommonLogger(req, error)
            return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

        }
        }

}


    