import { Injectable } from '@nestjs/common';
import { mf } from 'src/mf/interfaces/mf.interface';

@Injectable()
export class QueryService {
    constructor(){

    }

    async validateAndInsertMF(){
        const query = "select row_id,status,msg,mfid from registry.mf_iterator($1::integer[],$2::integer[],$3::text[],$4::text[],$5::jsonb[],$6::text[],$7::integer[])";
        return query
    }

    async bulkInsertStatement(event: mf) {
        let queryPrefix = `INSERT INTO registry.mf(eid, mfevt, eby, mfname, mfaddr, mfinfo) VALUES`
    
        const valuesArray = event?.edetails.map(detail => {
            const mfName = detail?.mfname; 
            const mfaddr = detail?.mfaddr;
            const mfinfo = JSON.stringify(detail?.mfinfo);
            const mfevt = 'MF_ONBOARDED';
        
            return `(${event?.eid}, '${mfevt}', ${event?.event_by}, '${mfName}', '${mfaddr}', '${mfinfo}'::jsonb)`;
        });
            const query = queryPrefix + valuesArray.join(', ') + ';';
        return query;
    }
    
}
