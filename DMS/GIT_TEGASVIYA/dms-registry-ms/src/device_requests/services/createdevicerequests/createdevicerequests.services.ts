import { Inject, Injectable } from '@nestjs/common';
import { DeviceRequest } from '../../interfaces/device_requests.interfaces';
import { QueryService } from '../query/query.services';
import {Pool} from 'pg'
import { deviceRequestMessage } from '../../../enums/device_request.enum'
import {message} from '../../../enums/message'
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";

@Injectable()
export class creatDeviceRequests {
    constructor(private qs: QueryService,
        @Inject('DATABASE_POOL') private readonly pool: Pool, private wl:WinstonLoggerService
    ) {

    }


    async createDeviceRequests(einfo: DeviceRequest) {
        try {
            let transformedData = await this.transformToRequestDeviceSchema(einfo)
            const hasCreateContext = transformedData.contexts.some(ctx => ctx === 'CREATE');

            if (hasCreateContext) {
                const totalQuantity = transformedData.deviceQuantities.reduce(
                    (acc, qty) => acc + (qty ?? 0),
                    0
                );
    
                if (totalQuantity < 1) {
                    return {
                        code: deviceRequestMessage.FAILURE_CODE,
                        message: deviceRequestMessage.LOW_QUANTITY_MESSAGE,
                        edata: {}
                    };
                }
            }
    


            let deviceRequestInsert = await this.qs.validateAndInsertDeviceRequest()
            let result = await this.pool.query(deviceRequestInsert, [
                transformedData?.rowIds,
                transformedData?.drids,
                transformedData?.contexts,
                transformedData?.bankNames,
                transformedData?.bankIds,
                transformedData?.branchNames,               
                transformedData?.merchantNames,
                transformedData?.simProviders,
                transformedData?.deviceQuantities,
                transformedData?.requestStatuses,
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
            this.wl.error("The error is::", error?.message)
            return message.ERROR.SERVER_ERROR
        }

    }




    async transformToRequestDeviceSchema(deviceRequestData: DeviceRequest) {

        const rowIds: (number | null)[] = [];
        const drids: (number | null)[] = [];
        const contexts: (string | null)[] = [];
        const bankNames: (string | null)[] = [];
        const bankIds: (number | null)[] = [];
        const branchNames: (string | null)[] = [];
        const merchantNames: (string | null)[] = [];
        const simProviders: (string | null)[] = [];
        const deviceQuantities: (number | null)[] = [];
        const requestStatuses: (string | null)[] = [];
        const eventBys: (string | null)[] = [];
        const eids: (number | null)[] = [];

        const eventData = deviceRequestData.edetails;
        const eventBy = deviceRequestData.event_by || null;
        const eid = deviceRequestData.eid || null;
        // const event = deviceRequestData.event || null;

        for (let edetail of eventData) {
            rowIds.push(edetail?.row_id);
            drids.push(edetail?.drid);
            contexts.push(edetail?.context);
            bankNames.push(edetail?.bank_name);
            bankIds.push(edetail?.bank_id);
            branchNames.push(edetail?.branch_name);
            merchantNames.push(edetail?.merchant_name);
            simProviders.push(edetail?.sim_provider);
            deviceQuantities.push(edetail?.device_quantity);
            requestStatuses.push(edetail?.status);
            eventBys.push(eventBy);
            eids.push(eid);
        }

        return {rowIds, drids, contexts, bankNames, bankIds, branchNames, merchantNames, simProviders, deviceQuantities, requestStatuses, eventBys, eids}
    }





}