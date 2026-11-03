import { Inject, Injectable } from '@nestjs/common';
import { Devices } from 'src/devices/interfaces/devices.interfaces';
import { QueryService } from '../query/query.services';
import {Pool} from 'pg'
import { message } from '../../../enums/message'
import { devicesMessage } from '../../../enums/devices.enums'


@Injectable()
export class onboardDevicesService {
    constructor(private qs: QueryService,
        @Inject('DATABASE_POOL') private readonly pool: Pool
    ) {

    }


    async createDevice(einfo: Devices) {
        try {
            let transformedData = await this.transformToDeviceSchema(einfo)
            let deviceInsert = await this.qs.validateAndInsertDevice()
            let result = await this.pool.query(deviceInsert, [
                transformedData?.rowIds,
                transformedData?.did,
                transformedData?.mfNames,
                transformedData?.deviceNames,
                transformedData?.modelNames,
                transformedData?.firmwareNames,
                transformedData?.imei,
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
                    code: devicesMessage.SUCCESS_CODE,
                    message: devicesMessage.SUCCESS_MESSAGE,
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




    async transformToDeviceSchema(deviceData: Devices) {
        const rowIds: (number | null)[] = [];
        const did: (number | null)[] = [];
        const imei: (string | null)[] = [];
        const mfNames: (string | null)[] = [];
        const deviceNames: (string | null)[] = [];
        const modelNames: (string | null)[] = [];
        const firmwareNames: (string | null)[] = [];
        const eventBys: (string | null)[] = [];
        const eids: (number | null)[] = [];

        const eventData = deviceData.edetails;
        const eventBy = deviceData.event_by || null;
        const eid = deviceData.eid || null;
        for (let edetail of eventData) {
            rowIds.push(edetail?.row_id);
            did.push(edetail?.device_id);
            imei.push(edetail?.imei);
            mfNames.push(edetail?.mfid);
            deviceNames.push(edetail?.dname);
            modelNames.push(edetail?.model_id);
            firmwareNames.push(edetail?.firmware_id);
            eventBys.push(eventBy);
            eids.push(eid);
        }

        return { rowIds,did, mfNames, deviceNames, modelNames, firmwareNames,imei, eventBys, eids };
    }



    async getDevicesDetailsExecution(data) {
      try{
          const queryStr = await this.qs.getDeviceDetails(data);
          const result = await this.pool.query(queryStr.query, queryStr.values);
          if(result.rowCount > 0){
              return {
                  code: devicesMessage.SUCCESS_CODE,
                  data: result.rows
              }
          }
          else {
              return {
                  code: devicesMessage.FAILURE_CODE,
                  message: devicesMessage.NO_RECORDS
              }
          }
      }
      catch (e) {
          return {
              code: devicesMessage.ERROR_CODE,
              message: e.message
          }
      }
    }

}

