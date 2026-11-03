import {Injectable} from '@nestjs/common';
import { query } from 'express';
import { console } from 'inspector';

@Injectable()
export class CommonqueryService {
    constructor(

    ){
    }
     entityQuery(data, context, count) {
        const mainQuery = {
            bank: {
                query 
                    :count? `SELECT count(bid) FROM registry.banks WHERE isd = false AND isa = true`       
                    : `SELECT bid, bname, baddr, binfo, 
                        (SELECT count(*) FROM registry.branches 
                         WHERE registry.branches.bid = registry.banks.bid 
                         AND isd = false AND isa = true) AS branch_count  
                       FROM registry.banks 
                       WHERE ${data?.bid ? `bname = $3::text AND` : ``} 
                             isd = false  
                       ORDER BY bid ASC 
                       OFFSET $1 LIMIT $2`,
                
                value:count 
                    ? []  
                        : data?.bid 
                            ? [data.offset, data.limit, data.bid] 
                            : [data.offset, data.limit] 
            }
            ,
            branch: {
                query: 
                count && data.brid? `SELECT count(brid) FROM registry.branches WHERE isd = false AND isa = true AND brname = $1`
                :count
                  ? `SELECT count(brid) FROM registry.branches WHERE isd = false AND isa = true${data?.bid ? " AND bid =(SELECT b.bid FROM registry.banks b WHERE bname = $1)" : ""}`
                  :data.brid? `SELECT br.brid, br.brname, br.braddr, br.brinfo, b.bname FROM registry.branches br JOIN registry.banks b ON b.bid=br.bid WHERE br.isd = false AND br.isa = true AND br.brname = $1`
                  : `SELECT br.brid, br.brname, br.braddr, br.brinfo,b.bname FROM registry.branches br JOIN registry.banks b ON b.bid=br.bid WHERE br.isd = false AND br.isa = true${data?.bid ? " AND br.bid = (SELECT b.bid FROM registry.banks b WHERE bname =$3)" : ""} ORDER BY brid ASC OFFSET $1 LIMIT $2`,
            
                value:count && data.brid?[data.brid] :count ? (data.bid ? [data.bid] : []) :data.brid? [data.brid]: (data.bid ? [data.offset, data.limit, data.bid] : [data.offset, data.limit])
            },
            firmware: {
                query: count ?
                `SELECT count(fid) FROM registry.firmware WHERE mfid =(SELECT mf.mfid FROM registry.mf WHERE mfname= $1) AND isd = false `
                :
                `select f.fid, f.fname, fv.eat FROM registry.firmware as f JOIN registry.firmware_v as fv ON fv.fid = f.fid WHERE f.isd = FALSE AND  fv.op = $1 AND f.mfid =(SELECT mf.mfid FROM registry.mf WHERE mfname=  $2) ORDER BY fid ASC OFFSET $3 LIMIT $4`,
                value: count? [data.mfid]:  ['CREATED', data.mfid, data.offset, data.limit]
            },
            manufacturer: {
                query: `SELECT ${count? ` count(mfid) ` : ` mfid, mfname, mfaddr, mfinfo` } FROM  registry.mf WHERE isd = false  ${count? ``:` ORDER BY mfname ASC OFFSET $1 LIMIT $2`}`,
                value: count? []:  [data.offset, data.limit]
            },
            model: {
                query: count ?
                 `SELECT count(mdid) FROM registry.model WHERE mfid =(SELECT mf.mfid FROM registry.mf WHERE mfname=  $1 )AND isd = false `
                 :
                 `select md.mdid, md.mdname, mdv.eat FROM registry.model as md JOIN registry.model_v as mdv ON mdv.mdid = md.mdid WHERE md.isd = FALSE AND mdv.op = $1 AND md.mfid =(SELECT mf.mfid FROM registry.mf WHERE mfname= $2) ORDER BY mdid ASC  OFFSET $3 LIMIT $4`,
                 value:count? [data.mfid]:  ['CREATED', data.mfid, data.offset, data.limit]
            },
            merchant: {
                query: count && data.bid && data.brid ?`SELECT count(mpid) FROM registry.merchants WHERE bid =(SELECT banks.bid FROM registry.banks WHERE bname =  $1) AND brid =(SELECT branches.brid FROM registry.branches WHERE brname = $2) AND isd = false AND isa = true`
                    :count && data.mname
                    ? `SELECT count(mpid)
                       FROM registry.merchants 
                       WHERE bid =(SELECT b.bid FROM registry.banks b WHERE bname =  $1) AND mname = $2 AND isd = false AND isa = true`
                    : count 
                        ? `SELECT count(mpid)
                            FROM registry.merchants 
                            WHERE bid=(SELECT b.bid FROM registry.banks b WHERE bname =  $1 ) AND isd = false AND isa = true`
                        : data.mname
                            ? `SELECT mpid, mname, minfo, maddr 
                               FROM registry.merchants 
                               WHERE isd = false AND isa = true AND mname = $1 AND bid =(SELECT b.bid FROM registry.banks b WHERE bname = $2)
                               ORDER BY mpid ASC OFFSET $3 LIMIT $4`
                            : data.brid? `SELECT mpid, mname, minfo, maddr
                                          FROM registry.merchants
                                          WHERE isd = false AND isa = true AND brid =(SELECT branches.brid FROM registry.branches WHERE brname = $1) AND bid =(SELECT b.bid FROM registry.banks b WHERE bname = $2)
                                          ORDER BY mpid ASC OFFSET $3 LIMIT $4`
                            : `SELECT mpid, mname, minfo, maddr 
                               FROM registry.merchants 
                               WHERE isd = false AND isa = true AND bid =(SELECT b.bid FROM registry.banks b WHERE bname = $1) 
                               ORDER BY mpid ASC OFFSET $2 LIMIT $3`,
                value: count && data.bid && data.brid ? [data.bid, data.brid]
                : count && data.mname
                    ? [ data.bid,data.mname]
                    : count 
                        ? [data.bid]
                        : data.mname
                            ? [data.mname, data.bid, data.offset , data.limit]
                            :data.brid? [data.brid,data.bid, data.offset , data.limit ]:[data.bid, data.offset , data.limit ]
            }
            
            
            
            
        }
        return mainQuery[context]
    }

    getFilteredData(filter, pagination,count) {
        let whereClause = '';
        const { bid, brid, inuse, isVpa ,did ,vpa} = filter;
        const { offset, limit } = pagination;
        let values = [];

        const selectClause =count? `count(s.did)`:` d.dname AS device_id, v.vpa AS vpa_id, m.mname AS merchant `;

        let query = `SELECT ${selectClause}
                     FROM registry.sb s
                     LEFT JOIN registry.vpa v ON v.vid = s.vid
                     LEFT JOIN registry.merchants m ON m.mpid = s.mid
                     LEFT JOIN registry.devices d ON d.did = s.did 
                     `;


        if (filter.ininventory){
            whereClause += whereClause ? ' AND ' : '';
            whereClause += '  s.bid IS NULL';
        }

        if (bid) {
            values.push(bid);
            whereClause += whereClause ? ' AND ' : '';
            whereClause += `s.bid = ANY($${values.length}::int[])`;
        }
        if (brid) {
            values.push(brid);
            whereClause += whereClause ? ' AND ' : '';
            whereClause += `s.brid = ANY($${values.length}::int[])`;
            // whereClause += inuse ? ' AND s.mid IS NOT NULL': ' AND s.mid IS NULL';
            // if (isVpa){
            //     whereClause += inuse ? ' AND s.did IS NOT NULL' : ' AND s.did IS NULL';
            // }
        }
        if (did) {
            values.push(did);
            whereClause += whereClause ? ' AND ' : '';
            whereClause += `dname ILIKE '%' || $${values.length} || '%'`;
        }

        if (vpa) {
            values.push(vpa);
            whereClause += whereClause ? ' AND ' : '';
            whereClause += `vpa ILIKE '%' || $${values.length} || '%'`;
        }

        whereClause += whereClause ? ' AND ' : '';
        whereClause += `d.isd = false AND d.isa = true`;


        if (whereClause) {
            query += `WHERE ${whereClause} `;
        }

        if (!count) {
            values.push(offset);
            values.push(limit);
            query += `ORDER BY s.did ASC OFFSET $${values.length - 1} LIMIT $${values.length }`;
        }
        return {query, values};
    }




    getBankList(filter, pagination,count) {
        let whereClause = '';
        const { bank_id} = filter;
        const { offset, limit } = pagination;
        let values = [];

        const selectClause =count? `count(bid)`:` bid,bname `;

        let query = `SELECT ${selectClause}
                     FROM registry.banks 
                     `;

        if (bank_id) {
            values.push(bank_id);
            whereClause += whereClause ? ' AND ' : '';
            whereClause += `bname ILIKE  '%' || $${values.length} || '%'`;
        }

        whereClause += whereClause ? ' AND ' : '';
        whereClause += `isd = false AND isa = true`;

        if (whereClause) {
            query += `WHERE ${whereClause} `;
        }

        if (!count) {
            values.push(offset);
            values.push(limit);
            query += `ORDER BY bid ASC OFFSET $${values.length - 1} LIMIT $${values.length }`;
        }
        return {query, values};
    }


    getBranchList(filter, pagination,count) {
        let whereClause = '';
        const { bid} = filter;
        const { offset, limit } = pagination;
        let values = [];

        const selectClause =count? `count(brid)`:` brid,brname `;

        let query = `SELECT ${selectClause}
                     FROM registry.branches 
                     `;

        if (bid) {
            values.push(bid);
            whereClause += whereClause ? ' AND ' : '';
            whereClause += `bid = (SELECT bid FROM registry.banks WHERE bname = $${values.length})`;
        }


        whereClause += whereClause ? ' AND ' : '';
        whereClause += `isd = false AND isa = true`;

        if (whereClause) {
            query += `WHERE ${whereClause} `;
        }

        if (!count) {
            values.push(offset);
            values.push(limit);
            query += `ORDER BY brid ASC OFFSET $${values.length - 1} LIMIT $${values.length }`;
        }
        return {query, values};
    }





    getMerchantQuery(filter, pagination) {
        let whereClause = '';
        const { bid ,brid,isactive } = filter;
        let values = [pagination.offset, pagination.limit];
    
        if (bid) {
            values.push(bid);
            whereClause += `m.bid = $${values.length}`;
        }
        if (brid) {
            values.push(brid);
            whereClause += whereClause ? ' AND ' : '';
            whereClause += `m.brid = ANY($${values.length}::int[])`;
            whereClause += isactive ? ' AND s.did IS NOT NULL': ' AND s.did IS NULL';
        }

        const selectClause = ` s.did AS device_id, v.vpa AS vpa_id, m.mname AS merchant `;
    
        let query = `SELECT ${selectClause}
                     FROM registry.sb s
                     RIGHT JOIN registry.merchants m ON m.mpid = s.mid
                     LEFT JOIN registry.vpa v ON v.vid = s.vid`;
    
        if (whereClause) {
            query += ` WHERE ${whereClause} `;
        }
    
        query += `ORDER BY m.mpid ASC OFFSET $1 LIMIT $2`;
    
        return { query, values };
    }


    getVpaQuery(filter, pagination) {
        let whereClause = '';
        const { bid,brid,inuse } = filter;
        let values = [pagination.offset, pagination.limit];
    
        if (bid) {
            values.push(bid);
            whereClause += `v.bid = $${values.length}`;
        }
        if (brid) {
            values.push(brid);
            whereClause += whereClause ? ' AND ' : '';
            whereClause += `s.brid = ANY($${values.length}::int[])`;
            whereClause += inuse ? ' AND s.mid is NOT NULL': ' AND s.mid IS NULL';
        }
 
        const selectClause = ` s.did AS device_id, v.vpa AS vpa_id, m.mname AS merchant `;
    
        let query = `SELECT ${selectClause}
                    FROM registry.sb s
                    LEFT JOIN registry.merchants m ON m.mpid = s.mid
                    RIGHT JOIN registry.vpa v ON v.vid = s.vid`;
    
        if (whereClause) {
            query += ` WHERE ${whereClause} `;
        }
    
        query += `ORDER BY v.vpa ASC OFFSET $1 LIMIT $2`;
    
        return { query, values };
    }

    check(data) {
        let query = '';
        let values = [];
    
        if (data.vpa && data.bank_id) {
            query = 'SELECT 1 AS results FROM registry.vpa v WHERE v.vpa = $1 AND v.bid = (SELECT bid FROM registry.banks WHERE bname = $2  )AND isd = false AND isa = true';
            values = [data.vpa, data.bank_id];
        } else if (data.vpa && data.device_id) {
            query = 'SELECT 1 AS results FROM registry.sb WHERE vid = (select vid from registry.vpa where vpa=$1) AND did =(SELECT d.did FROM registry.devices d WHERE dname = $2) AND isd = false AND isa = true';
            values = [data.vpa, data.device_id];
        } else if (data.merchant_id && data.bank_id) {
            query = 'SELECT 1 AS results FROM registry.merchants WHERE mpid = (SELECT m.mpid FROM registry.merchants m WHERE mname = $1) AND bid  = (SELECT b.bid FROM registry.banks b WHERE bname = $2 ) AND isd = false AND isa = true';
            values = [data.merchant_id, data.bank_id];
        } else if (data.vpa && data.bank_id && data.isdelete) {
            query = 'SELECT 1 AS results FROM registry.vpa WHERE vpa = $1 AND bid = (SELECT b.bid FROM registry.banks b WHERE bname = $2  )';
            values = [data.vpa, data.bank_id, data.isdelete];
        } else if (data.bank_id && data.device_id) {
            query = 'SELECT EXISTS (SELECT 1 FROM registry.sb sb WHERE sb.did = (SELECT d.did FROM registry.devices d WHERE dname = $1) AND sb.bid = (SELECT b.bid FROM registry.banks b WHERE bname = $2  ) AND isd = false AND isa = true) AND EXISTS (SELECT 1 FROM registry.vpa WHERE bid =$2 AND NOT EXISTS (SELECT 1 FROM registry.sb WHERE sb.vid = vpa.vid AND isd = false and isa = true)LIMIT 1) AS results;';
            values = [data.device_id, data.bank_id];
        } else if (data.device_id) {
            query = 'SELECT 1 AS results FROM registry.devices WHERE dname = $1 AND isd = false AND isa = true';
            values = [data.device_id];
        }else {
            throw new Error('Invalid combination of data provided');
        }
    
        return { query, values };
    }

    policy(data){
        const query='SELECT policy_content FROM registry.policies WHERE policy_name = $1';
        const values = [data.policy_name]
        return{query,values}
    }

  


}
