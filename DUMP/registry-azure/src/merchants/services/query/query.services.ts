import { Injectable } from '@nestjs/common';
import { Merchant } from 'src/merchants/interfaces/merchant.interface';

@Injectable()
export class QueryService {
    constructor(){

    }

    async validateAndInsertMerchant(){
        const query = "select row_id,status,msg,merchant_name,brid,bid from registry.merchant_iterator($1,$2::integer[],$3::text[],$4::text[],$5::text[],$6::text[],$7::jsonb[],$8::integer[],$9,$10,$11)";
        return query
    }

    async bulkInsertStatement(event: Merchant){
        let queryPrefix = `INSERT INTO registry.merchants(mname,msid,bid,brid,maddr,minfo,mevt, eby, eid) VALUES`;
        const valuesArray = event.edetails?.map(detail => {
            const merchantName = detail?.mname;
            const bids = detail?.bank_id;
            const brids = detail?.branch_id;
            const minfo = detail.minfo;
            const msid = detail.msid;
            const mevt = 'MERCHANT_ONBOARDED';
    
            // Properly format values for SQL, ensuring JSON is stringified
            return `('${merchantName}', ${bids}, ${brids}, '${JSON.stringify(minfo)}', ${msid}, '${mevt}','${event?.event_by}','${event?.eid}')`;
        });
    
        // Join all values into a single string
        const query = queryPrefix + valuesArray.join(', ') + ';';
        return query;
    }
}
