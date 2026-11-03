import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { iEvent } from 'src/interface/iEvent';
import { QueryService } from '../query/query.service';
import { calcEpochDay, getWeekNumber } from '../utils/date';
import {CODE , generateResponse , ResponseCode , ResponseMessage} from '../../enums/response.enum';
import {WinstonLoggerService} from "../../../common/winstonlogger/winstonlogger.service";

@Injectable()
export class IntelService {
   
    lid: number;
    event_id: number;
    constructor(
        @Inject('DATABASE_POOL') private pool: Pool,
        private qs: QueryService, private wl:WinstonLoggerService
    ) {}
   
    public async getMetricsForContext(edata) {
        try {
            if(edata.context === 'device_request' && (edata.role === 'CO Bank Admin' || edata.role === 'CO Bank RM')){
                return generateResponse(200, CODE.SUCCESS, []);
            }
            const metricQuery = await this.qs.getMetricQuery(edata.context,edata.role,edata.userName);
            if(metricQuery){
                const result = await this.pool.query(metricQuery.query, metricQuery.values);
                if (result?.rowCount > 0) {
                    return generateResponse(200, CODE.SUCCESS,result?.rows);
                }
            }
            return generateResponse(200, CODE.SUCCESS, []);

        } catch (error) {
            this.wl.error('Error in checkFuncDatasetForEvent:', error);
            return generateResponse(400, CODE.ERROR, error.message );

        }
    }

    async addUserPermissions(body){
        try{
            const queryStr = await this.qs.upermissions(body);
            const result = await this.pool.query(queryStr.query, queryStr.values);

            if(result.rowCount > 0){
                return generateResponse(201, CODE.SUCCESS,result?.rows);
            }
            else {
                return generateResponse(200, CODE.INVALID, ResponseMessage.INERTION_FAILURE);
            }

        }catch (e) {
            this.wl.error('Error in addUserPermissions:', e.message);
            return  generateResponse(400, CODE.ERROR, e.message);
        }
    }


}
