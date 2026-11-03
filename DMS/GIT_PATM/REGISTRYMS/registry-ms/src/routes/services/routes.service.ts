import {Body, Inject, Injectable} from '@nestjs/common';
import {RoutesQueryService} from "./routes-query/routes-query.service";
import {Pool} from 'pg'
import {CODE , commonEnum , generateResponse} from '../../common/enum/common.enum'
import { response} from '../../common/interface/common.interface'
import {WinstonLoggerService} from "../../common/service/winstonlogger/winstonlogger.service";
@Injectable()
export class RoutesService {
    constructor( private queryService: RoutesQueryService,
                 @Inject('DATABASE_POOL') private readonly pool: Pool, protected wl:WinstonLoggerService) {}

   async ExecuteGetDevicesQueryAndReturnResult(did: number) {
        try {
            const {query , values} = this.queryService.getRoutesDeviceAssociation( did );
            const result = await this.pool.query( query , values );
            if (result.rowCount > 0) {
                return generateResponse(200, CODE.SUCCESS, result.rows);

            }

        } catch (error) {
            this.wl.error("The error in route device association::", error?.message);
            return generateResponse(400, CODE.ERROR, error.message);

        }
    }

    async ExecuteRouteConfigQueryAndReturnResult() {
        try {
            const {query , values} = this.queryService.getRoutesConfig();
            const result = await this.pool.query( query , values );
            // console.log('config ---> ',result.rows);
            if (result.rowCount > 0) {
                return generateResponse(200, CODE.SUCCESS, result.rows);
            } else {
                return generateResponse(200, CODE.SUCCESS, []);

            }
        }catch(error) {
            this.wl.error("The error in get route config ::", error?.message);
            return generateResponse(400, CODE.ERROR, error.message);

        }

    }
        async ExecuteRouteQueryAndReturnResult(data) {
            try {
                const {query , values} = this.queryService.getRoutes( data );
                const result = await this.pool.query( query , values );
                // console.log('config ---> ',result.rows);
                if (result.rowCount > 0) {
                    return generateResponse(200, CODE.SUCCESS, result.rows);

                } else {
                    return generateResponse(200, CODE.SUCCESS, []);
                }

            }catch (e) {
                this.wl.error("The error in get routes  ::", e?.message);
                return generateResponse(400, CODE.ERROR, e.message);

            }
        }

}
