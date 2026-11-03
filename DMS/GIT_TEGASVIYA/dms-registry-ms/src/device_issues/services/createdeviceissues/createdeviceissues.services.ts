import { Inject, Injectable } from '@nestjs/common';
import { DeviceIssue } from '../../interfaces/device_issues.interfaces';
import { QueryService } from '../query/query.services';
import {Pool} from 'pg'
import { deviceIssueMessage } from '../../../enums/device_issue.enum'
import {message} from '../../../enums/message'
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";

@Injectable()
export class creatDeviceIssues {
    constructor(private qs: QueryService, private wl:WinstonLoggerService,
        @Inject('DATABASE_POOL') private readonly pool: Pool
    ) {

    }


    async createDeviceIssues(einfo: DeviceIssue) {
        try {
            let transformedData = await this.transformToDeviceIssuesSchema(einfo)
            let deviceIssueInsert = await this.qs.validateAndInsertDeviceIssue()
            let result = await this.pool.query(deviceIssueInsert, [
                transformedData?.rowid,
                transformedData?.iid,
                transformedData?.context,
                transformedData?.device,
                transformedData?.bank_name,
                transformedData?.bank_id,
                transformedData?.branch,
                transformedData?.vpa,
                transformedData?.merchant,
                transformedData?.mphno,
                transformedData?.status,
                transformedData?.issue,
                transformedData?.eventBy,
                transformedData?.eid
            ])
            if (result?.rows?.length > 0) {

                const headers = Object.keys(result.rows[0]);
                const values = result.rows.map(row => headers.map(header => row[header]));
                const totalRows = result.rows.length;
                const successfullyInserted = result.rows.filter(row => row.status === 1).length;
                const failedInserted = result.rows.filter(row => row.status === 0).length;
                const status = [totalRows, successfullyInserted, failedInserted];
                return {
                    code: deviceIssueMessage.SUCCESS_CODE,
                    message: deviceIssueMessage.SUCCESS_MESSAGE,
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




    async transformToDeviceIssuesSchema(deviceRequestData: DeviceIssue) {
        const eventData = deviceRequestData.edetails?.[0];

        return {
            rowid: eventData?.row_id ?? null,
            iid: eventData?.iid ?? null,
            context: eventData?.context ?? null,
            device: eventData?.device ?? null,
            vpa: eventData?.vpa ?? null,
            bank_name: eventData?.bank_name ?? null,
            bank_id: eventData?.bank_id ?? null,
            branch: eventData?.branch ?? null,
            merchant: eventData?.merchant ?? null,
            mphno: eventData?.mphno ?? null,
            status: eventData?.status ?? null,
            issue: eventData?.issue ?? null,
            eventBy: deviceRequestData.event_by ?? null,
            eid: deviceRequestData.eid ?? null,
        };
    }





}