import { Injectable } from '@nestjs/common';
import { vpa } from 'src/vpas/interfaces/vpa.interface';

@Injectable()
export class QueryService {
    constructor(){

    }

    async validateAndInsertVpa(){
        const query = "select row_id,status,msg,vid from registry.vpa_iterator($1,$2,$3,$4,$5,$6);"
        return query
    }

    async bulkInsertStatement(event: vpa) {
        let queryPrefix = `INSERT INTO registry.vpa(eid, vevt, eby, vpa, bid) VALUES`
    
        const valuesArray = event.edetails.map(detail => {
            const vpa = detail?.vpa; 
            const bid = detail?.bank_id;
            const vevt = 'VPA_ONBOARDED';
        
            return `(${event?.eid}, '${vevt}', ${event.event_by}, '${vpa}', ${bid})`;
        });
            const query = queryPrefix + valuesArray.join(', ') + ';';
        return query;
    }
    
}
