import { Inject, Injectable } from '@nestjs/common';
import { Branch } from 'src/branches/interfaces/branch.interface';
import { QueryService } from '../query/query.service';
import {Pool} from 'pg'
import { branchesMessage,GeneralErrors } from '../../../enums/branches.enums'
import { message } from '../../../enums/message'
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";

@Injectable()
export class onboardBranchService {
    constructor(private qs: QueryService,
        @Inject('DATABASE_POOL') private readonly pool: Pool, private wl: WinstonLoggerService
    ) {

    }


    async createBranch(einfo: Branch) {
        try {
            let transformedData = await this.transformToBranchSchema(einfo)
            let branchInsert = await this.qs.validateAndInsertBranch()
            let result = await this.pool.query(branchInsert, [
                transformedData?.rowIds,
                transformedData?.branchIds,
                transformedData?.bankNames,
                transformedData?.branchNames,
                transformedData?.branchAddrs,
                transformedData?.brinfoList,
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
                    code: branchesMessage.SUCCESS_CODE,
                    message: branchesMessage.SUCCESS_MESSAGE,
                    edata: {
                        headers,
                        values,
                        status
                    }
                };
            }
        }
        catch (error) {
            this.wl.error(`The error is::, ${error?.message}`);
            return message.ERROR.SERVER_ERROR
        }

    }




    async transformToBranchSchema(branchData: Branch) {
        const rowIds: (number | null)[] = [];
        const branchIds: (number | null)[] = [];
        const bankNames: (string | null)[] = [];
        const branchNames: (string | null)[] = [];
        const branchAddrs: (string | null)[] = [];
        const brinfoList: {}[] = [];
        const eventBys: (string | null)[] = [];
        const eids: (number | null)[] = [];

        const eventData = branchData?.edetails;
        const eventBy = branchData.event_by || null;
        const eid = branchData.eid || null;
        for (let edetail of eventData) {
            rowIds.push(edetail?.row_id);
            branchIds.push(edetail?.branch_id);
            bankNames.push(edetail?.bank_id);
            branchNames.push(edetail?.branch_name);
            branchAddrs.push(edetail?.braddr);
            brinfoList.push(JSON.stringify(edetail?.brinfo));
            eventBys.push(eventBy);
            eids.push(eid);
        }


        return { rowIds,branchIds ,bankNames, branchNames, branchAddrs, brinfoList, eventBys, eids };
    }

}

