import { Injectable } from '@nestjs/common';
import { Devices } from './../../interfaces/devices.interfaces';
import { rolesAccess } from '../../../config/roles-access';

@Injectable()
export class QueryService {
    constructor() {}

    async validateAndInsertDevice() {
        const query = "SELECT *  FROM registry.onboard_device($1,$2,$3,$4::integer[],$5::text[],$6::text[],$7::text[],$8::text[],$9::text[],$10::text[],$11::text[],$12::text[],$13::text[],$14,$15,$16::boolean[]);";
        return query;
    }

    async validateAndInsertMSBDevice() {
        const query = "SELECT *  FROM registry.onboard_msb_device($1,$2,$3,$4,$5,$6,$7);";
        return query;
    }


    async bulkInsertStatement(event: Devices) {
        const queryPrefix = `INSERT INTO registry.devices(eid, devt, eby, dname, mfid, mdid, fid) VALUES`;
        
        const valuesArray = event.edetails.map(detail => {
            const dname = detail?.dname; 
            const mfId = detail?.mf_id; 
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

    async getPaymentsForDevices(count= false,role){
        const queryStr = count ? rolesAccess[`${role}`].getDevicePaymentsCount : rolesAccess[`${role}`].getDevicePayments
        return queryStr
    }


    async getTelemetryForDevices(data){
        const query = rolesAccess[`${data.role}`].getDeviceTelemetry
        const values= [data.userName,data.device_id]
        return {query,values}
    }

    async enableSB(){
        const query = " SELECT row_id,status,msg FROM registry.enable_soundbox_iterator($1,$2,$3,$4);"
        return query
    }

    async updateDeviceLanguage(){
        const query = `SELECT * FROM registry.updateDevice(); `
        const values = [];
        return { query, values}
    }

    async getDeviceRoutes(did) {
        const query = `SELECT d.dname,d.imei, r.rcontext FROM registry.devices d  
                        LEFT JOIN registry.routes r 
                            ON r.mfid = d.mfid  
                        WHERE d.did = $1`
        return {query, values: [did]}
    }

    async updateDevice(body){
        const {row_id ,device_id ,
            firmware_id ,
            lang ,
            sbe }= body.edetails[0];
        const {eid, event_by} = body;
        const query = `SELECT * FROM registry.update_device($1,$2,$3,$4,$5,$6,$7);`
        const values = [row_id,device_id,firmware_id,lang,sbe,event_by,eid];
        return { query, values }
    }
}



