import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { QueryService } from '../query/query.services';
import { commonEnum } from 'src/common/enum/common.enum';
import { devicesMessage, GeneralErrors } from 'src/enums/devices.enums';
import { message } from 'src/enums/message';
@Injectable()
export class DeviceInfoService {
    constructor(@Inject('DATABASE_POOL') private readonly pool: Pool, private qs: QueryService) {

    }

    public async getPaymentsForDevices(dname: string, start_date: string, end_date: string, limit: number, offset: number){
        try {
        let paymentCountQuery = await this.qs.getPaymentsForDevices(true);
        let result = await this.pool.query(paymentCountQuery, [dname, start_date, end_date]);
        let count = parseInt(result?.rows[0]?.count);
        let dPyamentQuery = await this.qs.getPaymentsForDevices();
        let dPaymentsResult =  await this.pool.query(dPyamentQuery, [dname, start_date, end_date, limit, offset]);
        if(dPaymentsResult?.rowCount > 0){
            return {code: devicesMessage.SUCCESS_CODE, count: count, message: dPaymentsResult?.rows}
        }else{
            return {code: devicesMessage.FAILURE_CODE, message: devicesMessage.NO_RECORDS}
        } 
        } catch (error) {
            console.error("Error in getPaymentsForDevices is:::", error)
            throw new Error("Internal error")
        //    return { code: GeneralErrors.SERVER_ERROR_CODE, message: GeneralErrors.SERVER_ERROR_MESSAGE } 
        }
       
    }
}
