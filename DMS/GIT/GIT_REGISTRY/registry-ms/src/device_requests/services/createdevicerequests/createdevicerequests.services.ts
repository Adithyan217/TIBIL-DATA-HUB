import { Inject, Injectable } from '@nestjs/common';
import { DeviceRequest } from '../../interfaces/device_requests.interfaces';
import { QueryService } from '../query/query.services';
import {Pool} from 'pg'
import { deviceRequestMessage } from '../../../enums/device_request.enum'
import {message} from '../../../enums/message'

@Injectable()
export class creatDeviceRequests {
    constructor(private qs: QueryService,
        @Inject('DATABASE_POOL') private readonly pool: Pool
    ) {

    }


    async createDeviceRequests(einfo: DeviceRequest) {
        try {
            let transformedData = await this.transformToRequestDeviceSchema(einfo)
            let deviceRequestInsert = await this.qs.validateAndInsertDeviceRequest()
            let result = await this.pool.query(deviceRequestInsert, [
                transformedData?.drid,
                transformedData?.context,
                transformedData?.bank,
                transformedData?.branch,
                transformedData?.merchant,
                transformedData?.minfo,
                transformedData?.status,
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
                    code: deviceRequestMessage.SUCCESS_CODE,
                    message: deviceRequestMessage.SUCCESS_MESSAGE,
                    edata: {
                        headers,
                        values,
                        status
                    }
                };
            }
        }
        catch (error) {
            console.log("The error is::", error?.message)
            return message.ERROR.SERVER_ERROR
        }

    }




    async transformToRequestDeviceSchema(deviceRequestData: DeviceRequest) {
        const eventData = deviceRequestData.edetails?.[0];
    
        return {
            drid: eventData.drid || null,
            context: eventData.context || null,
            bank: eventData.bank || null,
            branch: eventData.branch || null,
            merchant: eventData.merchant || null,
            minfo: eventData.minfo || null,
            status: eventData.status || null,
            eventBy: deviceRequestData.event_by || null,
            eid: deviceRequestData.eid || null
        };
    }




}