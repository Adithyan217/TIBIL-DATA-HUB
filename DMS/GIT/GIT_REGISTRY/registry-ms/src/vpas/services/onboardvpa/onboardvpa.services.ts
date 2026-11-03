import { Inject, Injectable } from '@nestjs/common';
import { vpa } from 'src/vpas/interfaces/vpa.interface';
import { QueryService } from '../query/query.service';
import {Pool} from 'pg'
import { message } from '../../../enums/message'
import { vpaMessage } from 'src/enums/vpa.enums';

@Injectable()
export class onboardVpaService {
    constructor(private qs: QueryService,
        @Inject('DATABASE_POOL') private readonly pool: Pool
    ){

    }
    async createvpa(einfo: vpa) {
        try {
            let transformedData = await this.transformToVpaSchema(einfo)
            let vpaInsert = await this.qs.validateAndInsertVpa()
            let result = await this.pool.query(vpaInsert, [
                transformedData?.rowIds,
                transformedData?.vpas,
                transformedData?.deviceNames,
                transformedData?.bankNames,
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
                    code: vpaMessage.SUCCESS_CODE,
                    message: vpaMessage.SUCCESS_MESSAGE,
                    edata: {
                        headers,
                        values,
                        status
                    }
                };
            }
        }
        catch (error) {
            console.log("The error in onboarding::", error?.message)
            return message.ERROR.SERVER_ERROR
        }

    }


    async transformToVpaSchema(vpaData: vpa) {
        const rowIds: (number | null)[] = [];
        const vpas: (string | null)[] = [];
        const bankNames: (string | null)[] = [];
        const deviceNames: (string | null)[] = [];
        const eventBys: (string | null)[] = [];
        const eids: (number | null)[] = [];

        const eventData = vpaData.edetails;
        const eventBy = vpaData.event_by || null;
        const eid = vpaData.eid || null;
        for (let edetail of eventData) {
            rowIds.push(edetail.row_id);
            vpas.push(edetail.vpa);
            bankNames.push(edetail.bank_id);
            deviceNames.push(edetail.device_id);
            eventBys.push(eventBy);
            eids.push(eid);
        }


        return { rowIds, vpas, deviceNames,bankNames, eventBys, eids };
    }

}
