import { Inject, Injectable } from '@nestjs/common';
import { firmware } from '../../interfaces/firmwares.interface';
import { QueryService } from '../query/query.service';
import {Pool} from 'pg'
import { message } from '../../../enums/message'
import { firmwareOnboardingMessage } from '../../../enums/firmware.enums';
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";
import {generateResponse} from "../../../common/enum/common.enum";

@Injectable()
export class onboardFirmwareService {
    constructor(private qs: QueryService,
        @Inject('DATABASE_POOL') private readonly pool: Pool, private wl: WinstonLoggerService
    ){

    }
    async createFirmware(einfo: firmware) {
        try {
            let transformedData = await this.transformToFirmwareSchema(einfo)
            let firmwareInsert = await this.qs.validateAndInsertFirmware()
            let result = await this.pool.query(firmwareInsert, [
                transformedData?.rowIds,
                transformedData?.mfNames,
                transformedData?.firmwareNames,
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
                    code: firmwareOnboardingMessage.SUCCESS_CODE,
                    message: firmwareOnboardingMessage.SUCCESS_MESSAGE,
                    edata: {
                        headers,
                        values,
                        status
                    }
                };
            }
        }
        catch (error) {
            this.wl.error(`The error in onboarding::, ${error?.message}`);
            return message.ERROR.SERVER_ERROR
        }

    }


    async transformToFirmwareSchema(firmwareData: firmware) {
        const rowIds: (number | null)[] = [];
        const firmwareNames: (string | null)[] = [];
        const mfNames: (string | null)[] = [];
        const eventBys: (string | null)[] = [];
        const eids: (number | null)[] = [];

        const eventData = firmwareData.edetails;
        const eventBy = firmwareData.event_by || null;
        const eid = firmwareData.eid || null;
        for (let edetail of eventData) {
            rowIds.push(edetail?.row_id);
            firmwareNames.push(edetail.fname);
            mfNames.push(edetail.mfid);
            eventBys.push(eventBy);
            eids.push(eid);
        }


        return { rowIds, firmwareNames, mfNames, eventBys, eids };
    }

}
