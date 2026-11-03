import { Inject, Injectable } from '@nestjs/common';
import { Bank } from 'src/banks/interfaces/bank.interface';
import { QueryService } from '../query/query.service';
import {Pool} from 'pg'
import { message } from '../../../enums/message'
import { banksMessage } from 'src/enums/banks.enums';
@Injectable()
export class onboardBankService {
    constructor(private qs: QueryService,
        @Inject('DATABASE_POOL') private readonly pool: Pool
    ) {

    }


    async createBank(einfo: Bank) {
        try {
            let transformedData = await this.transformToBankSchema(einfo)
            let bankInsert = await this.qs.validateAndInsertBanks()
            let result = await this.pool.query(bankInsert, [
                transformedData?.rowIds,
                transformedData?.bankIds,
                transformedData?.bankNames,
                transformedData?.bankAddrs,
                transformedData?.binfoList,
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
                    code: banksMessage.SUCCESS_CODE,
                    message: banksMessage.SUCCESS_MESSAGE,
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




    async transformToBankSchema(bankData: Bank) {
        const rowIds: (number | null)[] = [];
        const bankIds: (number | null)[] = [];
        const bankNames: (string | null)[] = [];
        const bankAddrs: (string | null)[] = [];
        const binfoList: {}[] = [];
        const eventBys: (string | null)[] = [];
        const eids: (number | null)[] = [];

        const eventData = bankData.edetails;
        const eventBy = bankData?.event_by || null;
        const eid = bankData.eid || null;
        for (let edetail of eventData) {
            rowIds.push(edetail.row_id);
            bankIds.push(edetail?.bank_id);
            bankNames.push(edetail?.bank_name);
            bankAddrs.push(edetail?.baddr);
            binfoList.push(JSON.stringify(edetail?.binfo));
            eventBys.push(eventBy);
            eids.push(eid);
        }


        return { rowIds, bankIds, bankNames, bankAddrs, binfoList, eventBys, eids };
    }

}

