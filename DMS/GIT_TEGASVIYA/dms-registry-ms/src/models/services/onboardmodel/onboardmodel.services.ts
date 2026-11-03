import { Inject, Injectable } from '@nestjs/common';
import { model } from '../../../models/interfaces/model.interface';
import { QueryService } from '../query/query.service';
import {Pool} from 'pg'
import { message } from '../../../enums/message'
import { modelMessage } from '../../../enums/model.enums';
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";

@Injectable()
export class onboardModelService {
    constructor(private qs: QueryService,
        @Inject('DATABASE_POOL') private readonly pool: Pool, protected wl:WinstonLoggerService
    ){

    }
    async createModel(einfo: model) {
        try {
            let transformedData = await this.transformToModelSchema(einfo)
            let modelInsert = await this.qs.validateAndInsertModel()
            let result = await this.pool.query(modelInsert, [
                transformedData?.rowIds,
                transformedData?.mfNames,
                transformedData?.mdName,
                transformedData?.fNames,
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
                    code: modelMessage.SUCCESS_CODE,
                    message: modelMessage.SUCCESS_MESSAGE,
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


    async transformToModelSchema(mdData: model) {
        const rowIds: (number | null)[] = [];
        const mfNames: (string | null)[] = [];
        const mdName: (string | null)[] = [];
        const fNames: (string | null)[] = [];
        const eventBys: (string | null)[] = [];
        const eids: (number | null)[] = [];

        const eventData = mdData?.edetails;
        const eventBy = mdData.event_by || null;
        const eid = mdData.eid || null;
        for (let edetail of eventData) {
            rowIds.push(edetail.row_id);
            mfNames.push(edetail.mfid);
            mdName.push(edetail.model_name);
            fNames.push(edetail.firmware_id);
            eventBys.push(eventBy);
            eids.push(eid);
        }


        return { rowIds, mfNames, mdName, fNames, eventBys, eids };
    }

}
