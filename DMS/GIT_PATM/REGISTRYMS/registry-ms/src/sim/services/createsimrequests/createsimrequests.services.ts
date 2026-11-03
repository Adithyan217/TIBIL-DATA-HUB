import { Inject, Injectable } from '@nestjs/common';
import { SimRequest } from '../../interfaces/sim.interfaces';
import { QueryService } from '../query/query.services';
import {Pool} from 'pg'
import { simRequestMessage } from '../../../enums/sim_request.enum';
import {message} from '../../../enums/message'
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";

@Injectable()
export class createSimRequests {
    constructor(private qs: QueryService, private wl:WinstonLoggerService,
        @Inject('DATABASE_POOL') private readonly pool: Pool
    ) {

    }


    async createSimRequests(einfo: SimRequest) {
        try {
            let transformedData = await this.transformToSimRequestsSchema(einfo)
            let SimRequestInsert = await this.qs.validateAndInsertSimRequest()
            let result = await this.pool.query(SimRequestInsert, [
                transformedData?.rowid,
                transformedData?.srid,
                transformedData?.context,
                transformedData?.device,
                transformedData?.bank_name,
                transformedData?.bank_id,
                transformedData?.branch,
                transformedData?.merchant,
                transformedData?.status,
                transformedData?.eventBy,
                transformedData?.eid,
                transformedData?.current_sp,
                transformedData?.requested_sp
            ])
            if (result?.rows?.length > 0) {

                const headers = Object.keys(result.rows[0]);
                const values = result.rows.map(row => headers.map(header => row[header]));
                const totalRows = result.rows.length;
                const successfullyInserted = result.rows.filter(row => row.status === 1).length;
                const failedInserted = result.rows.filter(row => row.status === 0).length;
                const status = [totalRows, successfullyInserted, failedInserted];
                return {
                    code: simRequestMessage.SUCCESS_CODE,
                    message: simRequestMessage.SUCCESS_MESSAGE,
                    edata: {
                        headers,
                        values,
                        status
                    }
                };
            }
        }
        catch (error) {
            this.wl.error(`The error is::", ${error?.message}`)
            return message.ERROR.SERVER_ERROR
        }

    }




    async transformToSimRequestsSchema(simRequestData: SimRequest) {
        const eventData = simRequestData.edetails?.[0];

        return {
            rowid: eventData?.row_id ?? null,
            srid: eventData?.srid ?? null,
            context: eventData?.context ?? null,
            device: eventData?.device ?? null,
            bank_name: eventData?.bank_name ?? null,
            bank_id: eventData?.bank_id ?? null,
            branch: eventData?.branch ?? null,
            merchant: eventData?.merchant ?? null,
            status: eventData?.status ?? null,
            eventBy: simRequestData.event_by ?? null,
            eid: simRequestData.eid ?? null,
            current_sp: eventData?.current_sp ?? null,
            requested_sp: eventData?.requested_sp ?? null,
        };
    }





}