import { Inject, Injectable } from '@nestjs/common';
import { Devices } from '../../interfaces/devices.interfaces';
import { QueryService } from '../query/query.services';
import {Pool} from 'pg'
import { message } from '../../../enums/message'
import { devicesMessage } from '../../../enums/devices.enums'
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";
import {generateResponse, CODE, MESSAGE} from "../../../common/enum/common.enum";


@Injectable()
export class onboardDevicesService {
    constructor(private qs: QueryService,
        @Inject('DATABASE_POOL') private readonly pool: Pool, private wl: WinstonLoggerService) {}


        async createDevice(einfo: Devices) {
            try {
                let transformedData = await this.transformToDeviceSchema(einfo)
                let deviceInsert = await this.qs.validateAndInsertDevice()
                let result = await this.pool.query(deviceInsert, [
                    transformedData?.rowIds,
                    transformedData?.onboardStatus,
                    transformedData?.event,
                    transformedData?.did,
                    transformedData?.deviceNames,
                    transformedData?.mfNames,
                    transformedData?.modelNames,
                    transformedData?.firmwareNames,
                    transformedData?.imei,
                    transformedData?.vpaNames,
                    transformedData?.bankNames,
                    transformedData?.branchNames,
                    transformedData?.merchantNames,
                    transformedData?.eventBys,
                    transformedData?.eids,
                    transformedData?.sbenable
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
                else {
                    return {
                        code: devicesMessage.FAILURE_CODE,
                        message: devicesMessage.FAILURE_MESSAGE
                    }
                }
            }
            catch (error) {
                this.wl.error(`The error is::", ${error?.message}`)
                return {
                    code: devicesMessage.FAILURE_CODE,
                    message: error.message
                }
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
        const sbenable: (boolean | null)[] = [];
        const bankNames: (string | null)[] = [];
        const branchNames: (string | null)[] = [];
        const merchantNames: (string | null)[] = [];
        const vpaNames: (string | null)[] = [];
        const eventBys: (string | null)[] = [];
        const eids: (number | null)[] = [];

        const eventData = deviceData.edetails;
        const eventBy = deviceData.event_by || null;
        const eid = deviceData.eid || null;
        const event = deviceData.event || null;
        const onboardStatus = eventData[0].onboard_status || null;
        for (let edetail of eventData) {
            rowIds.push(edetail?.row_id);
            did.push(edetail?.device_id);
            imei.push(edetail?.imei);
            mfNames.push(edetail?.mf_id);
            deviceNames.push(edetail?.dname);
            modelNames.push(edetail?.model_id);
            firmwareNames.push(edetail?.firmware_id);
            sbenable.push(edetail?.sbe)
            bankNames.push(edetail?.bank_id);
            branchNames.push(edetail?.branch_id);
            merchantNames.push(edetail?.merchant_id);
            vpaNames.push(edetail?.vpa_id)
            eventBys.push(eventBy);
            eids.push(eid);
        }

        return { rowIds,onboardStatus,did,event, mfNames, bankNames,branchNames,merchantNames,vpaNames,deviceNames, modelNames, firmwareNames,imei,sbenable, eventBys, eids };
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
          this.wl.error(e.message);
          return {
              code: devicesMessage.ERROR_CODE,
              message: e.message
          }
      }
    }



    async transformToSoundboxSchema(sbdata:Devices){
        const rowIds: (number | null)[] = [];
        const did: (number | null)[] = [];
        const eventBys: (string | null)[] = [];
        const eids: (number | null)[] = [];

        const eventData = sbdata.edetails;
        const eventBy = sbdata.event_by || null;
        const eid = sbdata.eid || null;
        const event = sbdata.event || null;
        for (let edetail of eventData) {
            rowIds.push(edetail?.row_id);
            did.push(edetail.device_id);
            eventBys.push(eventBy);
            eids.push(eid);

        }
        return {rowIds,did,eventBys,eids}

    }
    
    async enableSoundbox(einfo:Devices) {
        try {
            let transformedData = await this.transformToSoundboxSchema(einfo)
            let enableSoundbox = await this.qs.enableSB()
            let result = await this.pool.query(enableSoundbox, [
                transformedData?.rowIds,
                transformedData?.did,
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
                return generateResponse(200, CODE.SUCCESS, [], {message: MESSAGE.SOUNDBOX_ENABLED, edata: {
                        headers,
                        values,
                        status
                    } });

            }
            else {
                return generateResponse(200, CODE.ERROR, MESSAGE.INVALID);
            }
        }
        catch (error) {
            this.wl.error(`The error is::, ${error?.message}`)
            return  generateResponse(500, CODE.ERROR, error.message);
        }

    }

}

