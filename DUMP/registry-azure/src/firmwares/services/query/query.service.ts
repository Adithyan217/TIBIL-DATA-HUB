import { Injectable } from '@nestjs/common';
import { firmware } from 'src/firmwares/interfaces/firmwares.interface';

@Injectable()
export class QueryService {
    constructor(){

    }

    async validateAndInsertFirmware(){
        const query = "select row_id,status,msg,fid AS firmware_name from registry.firmware_iterator($1,$2,$3,$4,$5)"
        return query
    }

    async bulkInsertStatement(event: firmware) {
        let queryPrefix = `INSERT INTO registry.mf(eid, fevt, eby, fname, mfid) VALUES`
    
        const valuesArray = event.edetails.map(detail => {
            const fname = detail?.fname;
            const mfid = detail?.mfid;
            const fevt = 'FIRMWARE_ONBOARDED';
        
            return `(${event?.eid}, '${fevt}', ${event?.event_by}, '${fname}', ${mfid})`;
        });
            const query = queryPrefix + valuesArray.join(', ') + ';';
        return query;
    }
    
}
