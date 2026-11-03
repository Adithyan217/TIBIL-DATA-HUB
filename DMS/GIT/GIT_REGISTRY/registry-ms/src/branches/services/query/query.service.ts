import { Injectable } from '@nestjs/common';
import { Branch } from 'src/branches/interfaces/branch.interface';

@Injectable()
export class QueryService {
    constructor() {}

    async validateAndInsertBranch() {
        const query = "SELECT row_id,status,msg,brid FROM registry.branch_iterator($1,$2::integer[],$3::integer[],$4::text[],$5::text[],$6::text[],$7::jsonb[],$8,$9 );";
        return query;
    }

    async bulkInsertStatement(event: Branch) {
        const queryPrefix = `INSERT INTO registry.branches(eid, brevt, eby, bid, brname, braddr, brinfo) VALUES`;
        
        const valuesArray = event.edetails.map(detail => {
            const bid = detail?.bank_id;
            const brname = detail?.branch_name; 
            const braddr = detail?.braddr;
            const brinfo = JSON.stringify(detail?.brinfo);
            const brevt = 'BRANCH_ONBOARDED';


            return `(${event?.eid}, '${brevt}', ${event?.event_by}, ${bid}, '${brname}', '${braddr}', '${brinfo}'::jsonb)`;
        });

        const query = queryPrefix + valuesArray.join(', ') + ';';
        return query;
    }
}
