import { Inject, Injectable } from '@nestjs/common';
import { Merchant } from 'src/merchants/interfaces/merchant.interface';
import { QueryService } from '../query/query.services';
import {Pool} from 'pg'
import { message } from '../../../enums/message'
import { merchantMessage } from 'src/enums/merchant.enums';
@Injectable()
export class onboardMerchantService {
    constructor(private qs: QueryService,
        @Inject('DATABASE_POOL') private readonly pool: Pool
    ) {

    }


    async createMerchant(einfo: Merchant) {
        try {
            let transformedData = await this.transformToMerchantSchema(einfo)
            let merchatInsert = await this.qs.validateAndInsertMerchant()
            let result = await this.pool.query(merchatInsert, [
                transformedData?.rowIds,
                transformedData?.mpid,
                transformedData?.merchantNames,
                transformedData?.maddrs,
                transformedData?.bankNames,
                transformedData?.branchNames,
                transformedData?.minfoList,
                transformedData?.msid,
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
                    code: merchantMessage.SUCCESS_CODE,
                    message: merchantMessage.SUCCESS_MESSAGE,
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




    async transformToMerchantSchema(merchantData: Merchant) {
        const rowIds: (number | null)[] = [];
        const mpid: (number | null)[] = [];
        const merchantNames: (string | null)[] = [];
        const maddrs: (string | null)[] = [];
        const bankNames: (string | null)[] = [];
        const branchNames: (string | null)[] = [];
        const minfoList: {}[] = [];
        const msid: (number | null)[] = [];
        const eventBys: (string | null)[] = [];
        const eids: (number | null)[] = [];
     
        const eventData = merchantData.edetails;
        const eventBy = merchantData.event_by || null;
        const eid = merchantData.eid || null;
        for (let edetail of eventData) {
            rowIds.push(edetail?.row_id);
            mpid.push(edetail?.merchant_id);
            merchantNames.push(edetail?.mname);
            maddrs.push(edetail?.maddr);
            bankNames.push(edetail?.bank_id);
            branchNames.push(edetail?.branch_id);
            minfoList.push(JSON.stringify(edetail?.minfo));
            msid.push(edetail?.msid);
            eventBys.push(eventBy);
            eids.push(eid);
        }



        return { rowIds,mpid, merchantNames,maddrs, bankNames, branchNames, minfoList, msid, eventBys, eids };
    }

}

