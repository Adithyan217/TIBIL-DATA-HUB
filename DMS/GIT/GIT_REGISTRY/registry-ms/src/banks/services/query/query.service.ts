import { Injectable } from '@nestjs/common';
import { Bank } from 'src/banks/interfaces/bank.interface';

@Injectable()
export class QueryService {
    constructor(){

    }

    async validateAndInsertBanks(){
        const query = "select row_id,status,msg,bid from registry.bank_iterator($1,$2::integer[],$3::text[],$4::text[],$5::jsonb[],$6,$7)"
        return query
    }

    async bulkInsertStatement(event: Bank){
        let queryPrefix = `INSERT INTO registry.banks(bname,baddr,binfo,bevt, eby, eid) VALUES`;
        const valuesArray = event.edetails?.map(detail => {
            const bankName = detail?.bank_name;
            const baddr =  detail?.baddr
            const binfo = detail.binfo;
            const bevt = 'BANK_ONBOARDED';
    
            // Properly format values for SQL, ensuring JSON is stringified
            return `('${bankName}', '${baddr}', '${JSON.stringify(binfo)}', '${bevt}','${event?.event_by}','${event?.eid}')`;
        });
    
        // Join all values into a single string
        const query = queryPrefix + valuesArray.join(', ') + ';';
        return query;
    }
}
