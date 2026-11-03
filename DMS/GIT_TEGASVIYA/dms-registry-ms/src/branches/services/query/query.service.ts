import { Injectable } from '@nestjs/common';
import { Branch } from 'src/branches/interfaces/branch.interface';

@Injectable()
export class QueryService {
    constructor() {}

    async validateAndInsertBranch() {
        const query = "SELECT row_id,status,msg,brid AS branch_name FROM registry.branch_iterator($1,$2::integer[],$3::text[],$4::text[],$5::text[],$6::jsonb[],$7,$8);";
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
    async getUserBranchesList(userName:string, context: string, bid:number) {
        const query = `
            SELECT br.brid, br.brname, up.context_id, up.username,up.context
            FROM registry.branches AS br
            LEFT JOIN registry.upermissions up ON up.context_id = br.brid AND up. context =  $2 AND up.isd = false
            WHERE up.username = $1  AND br.bid = $3
        `;

        return {
            query: query.trim(),
            values: [userName, context, bid],
        };
    }
}
