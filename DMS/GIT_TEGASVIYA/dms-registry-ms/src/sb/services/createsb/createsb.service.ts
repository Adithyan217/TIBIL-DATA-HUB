import { Inject, Injectable } from '@nestjs/common';
import { sb } from '../../../sb/interfaces/sb.interface';
import { QueryService } from '../query/query.service';
import {Pool} from 'pg'
import { message } from '../../../enums/message'
import { sbMessage } from '../../../enums/sb.enums';
import { max } from 'rxjs';
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";
@Injectable()
export class createSbService {
    constructor(private qs: QueryService,
        @Inject('DATABASE_POOL') private readonly pool: Pool, protected wl: WinstonLoggerService
    ) {

    }


    async createSb(einfo: sb) {
        try {
            let transformedData = await this.transformToSbSchema(einfo)
            let sbInsert = await this.qs.validateAndInsertSb()
            let result = await this.pool.query(sbInsert, [
                transformedData?.rowIds,
                transformedData?.event,
                transformedData?.vpa,
                transformedData?.device_id,
                transformedData?.bank_id,
                transformedData?.branch_id,
                transformedData?.merchant_id,
                transformedData?.eventBys,
                transformedData?.eids
            ])
            if (result?.rows?.length > 0) {
               
                const headers = Object.keys(result.rows[0]);
                const values = result.rows.map(row => headers.map(header => row[header]));
                const totalRows = result.rows.length;
                const successfullyInserted = result.rows.filter(row => row.status === 1).length;
                const failedInserted = result.rows.filter(row => row.status === 0).length;
                const status = [totalRows, successfullyInserted, failedInserted];
                return {
                    code: sbMessage.SUCCESS_CODE,
                    message: sbMessage.SUCCESS_MESSAGE,
                    edata: {
                        headers,
                        values,
                        status
                    }
                };
            }
        }
        catch (error) {

            this.wl.error("The error in onboarding::", error?.message)
            return message.ERROR.SERVER_ERROR
        }

    }




    async transformToSbSchema(sbData: sb) {
        const rowIds: (number | null)[] = [];
        const vpa: (string | null)[] = [];
        const device_id: (string | null)[] = [];
        const bank_id: (string | null)[] = [];
        const branch_id: (string | null)[] = [];
        const merchant_id: (string | null)[] = [];
        const eventBys: (string | null)[] = [];
        const eids: (number | null)[] = [];
        const eventData = sbData.edetails;
        const event = sbData.event || null;
        const eventBy = sbData.event_by || null;
        const eid = sbData.eid || null;
        for (let edetail of eventData) {
            rowIds.push(edetail.row_id || null);
            vpa.push(edetail?.vpa_id || null);
            device_id.push(edetail?.device_id || null);
            bank_id.push(edetail?.bank_id || null);
            branch_id.push(edetail?.branch_id || null);
            merchant_id.push(edetail?.merchant_id || null);
            eventBys.push(eventBy);
            eids.push(eid);
        }
        return { rowIds,event, vpa, device_id, bank_id, branch_id, merchant_id, eventBys, eids };
    }

}

