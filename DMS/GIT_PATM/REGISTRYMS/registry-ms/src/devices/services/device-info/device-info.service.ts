import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { QueryService } from '../query/query.services';
// import { commonEnum } from 'src/common/enum/common.enum';
import { devicesMessage, GeneralErrors } from '../../../enums/devices.enums';
import { message } from 'src/enums/message';
import { MSB } from '../../../enums/roles.enum';
import {MESSAGE, CODE, generateResponse} from '../../../common/enum/common.enum'
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";
@Injectable()
export class DeviceInfoService {
    constructor(@Inject('DATABASE_POOL') private readonly pool: Pool,
                private qs: QueryService, private wl: WinstonLoggerService) {
                    console.log(process.env.LIMIT)

    }

    public async getPaymentsForDevices(dname: string, start_date: string, end_date: string, limit: number, offset: number,userName,role){
        try {
        let paymentCountQuery = await this.qs.getPaymentsForDevices(true,role);
        let values =  role === MSB.MSB_USER ? [ dname, start_date, end_date] : [userName, dname, start_date, end_date];
        let result = await this.pool.query(paymentCountQuery, values);
        let count = parseInt(result?.rows[0]?.count);
        let dPyamentQuery = await this.qs.getPaymentsForDevices(false,role);
        let dValues =  role === MSB.MSB_USER ? [dname, start_date, end_date, limit, offset] : [userName,dname, start_date, end_date, limit, offset];
        let dPaymentsResult =  await this.pool.query(dPyamentQuery, dValues);
        if(dPaymentsResult?.rowCount > 0){

            return generateResponse(200, CODE.SUCCESS, dPaymentsResult?.rows, {count});

        }else{
            return generateResponse(200, CODE.SUCCESS, []);

        } 
        } catch (error) {
            this.wl.error(`Error in getPaymentsForDevices is:::", ${error}`)
            return generateResponse(400, CODE.ERROR, []);
        //    return { code: GeneralErrors.SERVER_ERROR_CODE, message: GeneralErrors.SERVER_ERROR_MESSAGE } 
        }
       
    }


    public async getTelemetryDetails(data){
        try{
            let queryStr = await this.qs.getTelemetryForDevices(data)
            let result = await this.pool.query(queryStr.query,queryStr.values)
            if(result.rowCount > 0){
                return generateResponse(200, CODE.SUCCESS, result.rows);

            }
            else {
                return generateResponse(200, CODE.SUCCESS, []);
            }
        }
        catch (e) {
            this.wl.error(`Error in getTelemetryDetails is:::", ${e.message}`)
            return generateResponse(200, CODE.ERROR, e.message);
        }
      }

    //   public async enableSoundbox(data){
    //     try{
    //         let queryStr = await this.qs.enableSB(data)
    //         let result = await this.pool.query(queryStr.query,queryStr.values)
    //         if(result.rowCount > 0){
    //             return {
    //                 code: devicesMessage.SUCCESS_CODE,
    //                 data: result.rows
    //             }
    //         }
    //         else {
    //             return {
    //                 code: devicesMessage.FAILURE_CODE,
    //                 message: 'Unable to Update'
    //             }
    //         }
    //     }
    //     catch (e) {
    //         return {
    //             code: devicesMessage.ERROR_CODE,
    //             message: e.message
    //         }
    //     }
    //   }
    
}
