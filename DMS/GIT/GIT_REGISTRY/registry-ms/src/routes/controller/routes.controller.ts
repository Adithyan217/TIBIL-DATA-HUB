import { Body, Controller, Post, Res } from '@nestjs/common';
import {RoutesService} from "../services/routes.service";
import {commonEnum} from '../../common/enum/common.enum';
import {response} from '../../common/interface/common.interface';
import {Response} from "express";
import { Routes } from '../interfaces/routes.interface';
@Controller('registry')
export class RoutesController {
    constructor(private routesService: RoutesService) {}
    @Post('/droutes/get')
    async getRouteDevices(@Res() res : Response, @Body() body: {did: number}) {
        const result = await this.routesService.ExecuteGetDevicesQueryAndReturnResult(body?.did);
        res.status(result.code === commonEnum.ERROR_CODE ? 400 : 200).send(result);
    }

    @Post('/routes/config/get')
    async getRoutesConfig(@Res() res : Response) {
        const result = await this.routesService.ExecuteRouteConfigQueryAndReturnResult();
        res.status(result.code === commonEnum.ERROR_CODE ? 400 : 200).send(result);
    }

    @Post('/routes/get')
    async getRoutes(@Body() rinfo: Routes, @Res() res: Response) {
        try {
            const result = await this.routesService.ExecuteRouteQueryAndReturnResult(rinfo);
            if(typeof result === 'object' && result?.code  === 200){
              res.status(200).send(result)
            }else{
              res.status(400).send(result)
            }

          } catch (error) {
            return res.status(500).json({
              status: 500,
              message: 'Unable fetch the data',
            });
          }
        }

}


    