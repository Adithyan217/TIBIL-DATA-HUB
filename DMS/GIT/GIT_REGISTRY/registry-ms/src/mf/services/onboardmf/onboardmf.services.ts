import { Inject, Injectable } from '@nestjs/common';
import { mf } from 'src/mf/interfaces/mf.interface';
import { QueryService } from '../query/query.service';
import {Pool} from 'pg'
import { message } from '../../../enums/message'
import { mfMessage } from 'src/enums/mf.enums';

@Injectable()
export class onboardMfService {
    constructor(private qs: QueryService,
        @Inject('DATABASE_POOL') private readonly pool: Pool
    ){

    }
    async createmf(einfo: mf) {
        try {
            let transformedData = await this.transformToMFSchema(einfo)
            let mfInsert = await this.qs.validateAndInsertMF()
            let result = await this.pool.query(mfInsert, [
                transformedData?.rowIds,
                transformedData?.mfIds,
                transformedData?.mfNames,
                transformedData?.mfAddrs,
                transformedData?.mfinfoList,
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
                    code: mfMessage.SUCCESS_CODE,
                    message: mfMessage.SUCCESS_MESSAGE,
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


    async transformToMFSchema(mfData: mf) {
        const rowIds: (number | null)[] = [];
        const mfIds: (number | null)[] = [];
        const mfNames: (string | null)[] = [];
        const mfAddrs: (string | null)[] = [];
        const mfinfoList: {}[] = [];
        const eventBys: (string | null)[] = [];
        const eids: (number | null)[] = [];

        const eventData = mfData.edetails;
        const eventBy = mfData.event_by || null;
        const eid = mfData.eid || null;
        for (let edetail of eventData) {
            rowIds.push(edetail.row_id);
            mfIds.push(edetail.mfid);
            mfNames.push(edetail.mfname);
            mfAddrs.push(edetail.mfaddr);
            mfinfoList.push(JSON.stringify(edetail.mfinfo));
            eventBys.push(eventBy);
            eids.push(eid);
        }


        return { rowIds,mfIds, mfNames, mfAddrs, mfinfoList, eventBys, eids };
    }

}
