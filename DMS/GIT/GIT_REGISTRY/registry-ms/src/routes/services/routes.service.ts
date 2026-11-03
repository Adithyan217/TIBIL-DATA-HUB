import {Body, Inject, Injectable} from '@nestjs/common';
import {RoutesQueryService} from "./routes-query/routes-query.service";
import {Pool} from 'pg'
import {commonEnum} from '../../common/enum/common.enum'
import { response} from '../../common/interface/common.interface'
@Injectable()
export class RoutesService {
    constructor( private queryService: RoutesQueryService,
                 @Inject('DATABASE_POOL') private readonly pool: Pool) {}

   async ExecuteGetDevicesQueryAndReturnResult(did: number) {
        const {query, values} = this.queryService.getRoutesDeviceAssociation(did);
        const result = await this.pool.query(query, values);
        if (result.rowCount > 0) {
            return {
                code: commonEnum.SUCCESS_CODE,
                data: result.rows
            }
        }
        else {
            
        }

    }

    async ExecuteRouteConfigQueryAndReturnResult() {
        const {query, values} = this.queryService.getRoutesConfig();
        const result = await this.pool.query(query, values);
        // console.log('config ---> ',result.rows);
        if (result.rowCount > 0) {
            return {
                code: commonEnum.SUCCESS_CODE,
                data: result.rows
            }
        }
        else {
            return {
                code: commonEnum.ERROR_CODE,
                message: commonEnum.NO_RECORDS,

            }
        }

    }
        async ExecuteRouteQueryAndReturnResult(data) {
        const {query,values} = this.queryService.getRoutes(data);
        const result = await this.pool.query(query, values);
        // console.log('config ---> ',result.rows);
        if (result.rowCount > 0) {
            return {
                code: commonEnum.SUCCESS_CODE,
                data: result.rows
            }
        }
        else {
            return {
                code: commonEnum.ERROR_CODE,
                message: commonEnum.NO_RECORDS,

            }
        }

    }


}
