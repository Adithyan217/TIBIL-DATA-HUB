import { Injectable } from '@nestjs/common';
import { Devices } from 'src/devices/interfaces/devices.interfaces';

@Injectable()
export class QueryService {
    constructor() {}

    async validateAndInsertDevice() {
        const query = "SELECT row_id,status,msg,did  FROM registry.device_iterator($1,$2::integer[],$3::text[],$4::text[],$5::text[],$6::text[],$7::text[],$8,$9);";
        return query;
    }

    async bulkInsertStatement(event: Devices) {
        const queryPrefix = `INSERT INTO registry.devices(eid, devt, eby, dname, mfid, mdid, fid) VALUES`;
        
        const valuesArray = event.edetails.map(detail => {
            const dname = detail?.dname; 
            const mfId = detail?.mfid; 
            const model_id = detail?.model_id;
            const firmware_id = detail?.firmware_id;
            const devt = 'DEVICE_ONBOARDED';

            return `(${event?.eid}, ' ${event?.event_by}, ${firmware_id}, '${mfId}', '${model_id}','${devt}', '${dname}`;
        });

        const query = queryPrefix + valuesArray.join(', ') + ';';
        return query;
    }


    getDeviceDetails(data){
        const query =`
            SELECT  
                d.did AS id,
                md.mdname AS model, 
                f.fname AS firmware_version, 
                mf.mfname AS manufacturer, 
                mf.mfid AS mfid,
                d.dname AS device_name,
                s.eat AS allocated_on, 
                v.vpa AS allocated_vpa,   
                b.bname AS allocated_bank,   
                br.brname AS allocated_branch ,
                m.mname AS allocated_merchant,
                CASE 
                    WHEN s.brid IS NULL THEN b.bname
                    WHEN s.mid IS NULL THEN br.brname
                    ELSE m.mname 
                END AS allocated_to,
                CASE 
                    WHEN s.mid IS NULL THEN 'Available for Allocation'
                    ELSE 'Allocated' 
                END AS device_status
            FROM registry.sb s
            INNER JOIN registry.devices d ON d.did = s.did 
            LEFT JOIN registry.vpa v ON v.vid = s.vid
            LEFT JOIN registry.merchants m ON m.mpid = s.mid
            LEFT JOIN registry.banks b ON b.bid = s.bid
            LEFT JOIN registry.branches br ON br.brid = s.brid
            LEFT JOIN registry.model md ON md.mdid = d.mdid
            LEFT JOIN registry.mf mf ON mf.mfid = d.mfid
            LEFT JOIN registry.firmware f ON f.fid = d.fid
            WHERE d.dname = $1 AND d.isd = false AND d.isa = true`;
        const values = [data.device_id]
        return {query,values}
    
    }

    async getPaymentsForDevices(count= false){
        const queryStr = count ? `SELECT COUNT(rrn) FROM registry.plog WHERE dname = $1 AND cat >= $2::date AND cat < $3::date;` : 
        `SELECT rrn, dname, cat AS received_at, txnamt AS amount,
        CASE WHEN status = 'RECEIVED_ACK_FROM_DEVICE' THEN
        'success' ELSE
        'FAILURE' 
        END AS Announcement_status
        FROM registry.plog
        where dname = $1 AND cat >= $2::date AND cat < $3::date
        LIMIT $4 OFFSET $5;`
        return queryStr
    }

}
