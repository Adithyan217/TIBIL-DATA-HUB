import {Injectable} from '@nestjs/common';
import { query } from 'express';
import { console } from 'inspector';
import { rolesAccess } from '../../config/roles-access';
import { Upermission } from '../interface/common.interface';
import { MSB } from 'src/enums/roles.enum';
@Injectable()
export class CommonqueryService {
    constructor(

    ){
    }
     entityQuery(data, context, count,role,userName) {
        const mainQuery = {
            firmware: {
                query: count ?
                `SELECT count(fid) FROM registry.firmware WHERE mfid =(SELECT mf.mfid FROM registry.mf WHERE mfname= $1) AND isd = false `
                :
                `select f.fid, f.fname, f.eat FROM registry.firmware as f 
                    WHERE f.isd = FALSE AND f.mfid =(SELECT mf.mfid FROM registry.mf WHERE mfname=  $1) 
                    ORDER BY fid ASC OFFSET $2 LIMIT $3`,
                value: count? [data.mfid]:  [ data.mfid, data.offset, data.limit]
            },
            manufacturer: {
                query: `SELECT ${count? ` count(mf.mfid) ` : ` mf.mfid, mfname, mfaddr, mfinfo,rcontext` } FROM  registry.mf mf JOIN registry.routes r ON r.mfid=mf.mfid WHERE mf.isd = false  ${count? ``:` ORDER BY mfname ASC OFFSET $1 LIMIT $2`}`,
                value: count? []:  [data.offset, data.limit]
            },
            model: {
                query: count ?
                 `SELECT count(mdid) FROM registry.model WHERE mfid =(SELECT mf.mfid FROM registry.mf WHERE mfname=  $1 )AND isd = false `
                 :
                 `select md.mdid, md.mdname, md.eat FROM registry.model as md 
                    WHERE md.isd = FALSE AND md.mfid =(SELECT mf.mfid FROM registry.mf WHERE mfname= $1) 
                    ORDER BY mdid ASC  OFFSET $2 LIMIT $3`,
                 value:count? [data.mfid]:  [ data.mfid, data.offset, data.limit]
            },
            merchant: {
                query: data.device_id
                  ? `SELECT ${count ? `count(mpid)` : `
                      mpid, 
                      mname, 
                      minfo,
                      (SELECT bname FROM registry.banks b WHERE b.bid = m.bid) AS bname,
                      (SELECT brname FROM registry.branches br WHERE br.brid = m.brid) AS brname
                    `}
                   FROM registry.merchants m
                   WHERE m.mpid = (
                      SELECT sb.mid 
                      FROM registry.sb 
                      WHERE did = (SELECT did FROM registry.devices WHERE dname = $1)
                   )
                   AND m.isd = false AND m.isa = true`
                  : data.bid && data.mname
                  ? `SELECT ${count ? `count(mpid)` : `
                      mpid, 
                      mname, 
                      minfo,
                      (SELECT bname FROM registry.banks b WHERE b.bid = m.bid) AS bname,
                      (SELECT brname FROM registry.branches br WHERE br.brid = m.brid) AS brname
                    `}
                   FROM registry.merchants m
                   WHERE bid = (
                      SELECT bid FROM registry.banks WHERE bname = $1
                   )
                   AND mname = $2
                   AND m.isd = false AND m.isa = true`
                  : data.mname
                  ? `SELECT ${count ? `count(mpid)` : `
                      mpid, 
                      mname, 
                      minfo,
                      (SELECT bname FROM registry.banks b WHERE b.bid = m.bid) AS bname,
                      (SELECT brname FROM registry.branches br WHERE br.brid = m.brid) AS brname
                    `}
                   FROM registry.merchants m
                   WHERE mname = $1
                   AND m.isd = false AND m.isa = true`
                  : `SELECT 0 AS count`,
              
                value: data.device_id
                  ? [data.device_id]
                  : data.bid && data.mname
                  ? [data.bid, data.mname]
                  : data.mname
                  ? [data.mname]
                  : []
              }
              
             
            
        }
        return mainQuery[context]
    }

    getEntityDetailsQuery(data,context,role,userName){
        const mainQuery = {
            bank: {
                query : rolesAccess[`${role}`].getBankDetails ,
                value : role === MSB.MSB_GUEST ? [data.bid] : [userName,data.bid]
            }
            ,
            branch: {
                query: rolesAccess[`${role}`].getBranchDetails,
                value:[userName,data.brid]
            },
            device: {
                query: rolesAccess[role].getDeviceDetails,
                value: role === 'MSB Guest' ? [ data.device_id] : [userName, data.device_id]
            },  
            merchant:{
                query: rolesAccess[`${role}`].getMerchantDetails,
                value:[userName,data.mname]
            }
        }
        return mainQuery[context]
    }

    getFilteredData(filter, pagination,count, role, userName) {
        let whereClause = '';
        const { bid, brid, inuse, isVpa ,did ,vpa,mfid,notenabled,enabled,dtype,mname} = filter;
        const { offset, limit } = pagination;
        let values = [];
        values.push(userName);

        // const selectClause =count? `count(s.did)`:` d.dname AS device_id, v.vpa AS vpa_id, m.mname AS merchant `;

        // let query = `SELECT ${selectClause}
        //              FROM registry.sb s
        //              LEFT JOIN registry.vpa v ON v.vid = s.vid
        //              LEFT JOIN registry.merchants m ON m.mpid = s.mid
        //              LEFT JOIN registry.devices d ON d.did = s.did
        //              `;

        let query = count ? rolesAccess[`${role}`].getDeviceCount : rolesAccess[`${role}`].getDeviceList;

        if (filter.ininventory){
            // whereClause += whereClause ? ' AND ' : '';
            // whereClause += '  s.bid IS NULL';
            query+= ` AND s.bid IS NULL `
        }

        if (bid) {
            values.push(bid);
            // whereClause += whereClause ? ' AND ' : '';
            // whereClause += `s.bid = ANY($${values.length}::int[])`;
            query+= ` AND s.bid = ANY($${values.length}::int[]) `
        }
        if (brid) {
            values.push(brid);
            // whereClause += whereClause ? ' AND ' : '';
            // whereClause += `s.brid = ANY($${values.length}::int[])`;
            query+= ` AND s.brid = ANY($${values.length}::int[]) `

        }
        if (did) {
            values.push(did);
            // whereClause += whereClause ? ' AND ' : '';
            // whereClause += `dname ILIKE '%' || $${values.length} || '%'`;
            query+=` AND dname ILIKE '%' || $${values.length} || '%'`
        }

        if (vpa) {
            values.push(vpa);
            // whereClause += whereClause ? ' AND ' : '';
            // whereClause += `vpa ILIKE '%' || $${values.length} || '%'`;
            query+= ` AND vpa ILIKE '%' || $${values.length} || '%' `
        }

        if (mfid){
            values.push(mfid);
            query+= ` AND d.mfid=(SELECT mfid FROM registry.mf WHERE mfname = $${values.length})`
        }

        if (notenabled){
            // values.push(isenabled)
            query += `AND d.sbe = false `
        }

        if (enabled){
            query += `AND d.sbe = true `
        }


        if (dtype){
            values.push(dtype);
            query += ` AND dt.dtname = $${values.length} `
        } 

        if (mname){
            values.push(mname);
            query += ` AND  m.mname = $${values.length}  `
        }
        // whereClause += whereClause ? ' AND ' : '';
        // whereClause += `AND d.isd = false AND d.isa = true`;


        // if (whereClause) {
        //     query += `WHERE ${whereClause} `;
        // }

        if (!count) {
            values.push(offset);
            values.push(limit);
            query += `ORDER BY s.did ASC OFFSET $${values.length - 1} LIMIT $${values.length }`;
        }
        return {query, values};
    }




    getBankList(filter, pagination,count, role, userName) {
        const  bank_id = filter?.bank_id ;
        const { offset, limit } = pagination;
        let values = [];
        values.push(userName);
        // const selectClause =count? `count(bid)`:` bid,bname `;

        // let query = `SELECT ${selectClause}
        //              FROM registry.banks
        //              `;
        let query = count ? rolesAccess[`${role}`].getBankCount : rolesAccess[`${role}`].getBankList;
        if (bank_id) {
            values.push(bank_id);
            // whereClause += whereClause ? ' AND ' : '';
            // whereClause += `bname ILIKE  '%' || $${values.length} || '%'`;
            // let query = rolesAccess[`${role}`].searchBank;
            query += ` AND bname ILIKE  '%' || $${values.length} || '%'`;
        }

        // whereClause += whereClause ? ' AND ' : '';
        // whereClause += `isd = false AND isa = true`;

        // if (whereClause) {
        //     query += `WHERE ${whereClause} `;
        // }

        if (!count) {
            values.push(offset);
            values.push(limit);
            query += ` ORDER BY bid ASC OFFSET $${values.length - 1} LIMIT $${values.length }`;
        }
        return {query, values};
    }


    getBranchList(filter, pagination,count, role, userName) {
        let whereClause = '';
        const bid  = filter?.bid;
        const brid  = filter?.brid || undefined;
        const { offset, limit } = pagination;
        let values = [];
        values.push(userName)

        // const selectClause =count? `count(brid)`:` brid,brname `;

        // let query = `SELECT ${selectClause}
        //              FROM registry.branches
        //              `;
        let query = count ? rolesAccess[`${role}`].getBranchCount : rolesAccess[`${role}`].getBranchList;

        if (bid) {
            values.push(bid);
            // whereClause += whereClause ? ' AND ' : '';
            // whereClause += `bid = (SELECT bid FROM registry.banks WHERE bname = $${values.length})`;
            query += ` AND bid = (SELECT bid FROM registry.banks WHERE bname = $${values.length}) `
        }
        if (brid) {
            values.push(brid);
            query += ` AND brname ILIKE  '%' || $${values.length} || '%'`
        }


        // whereClause += whereClause ? ' AND ' : '';
        // whereClause += `isd = false AND isa = true`;

        // if (whereClause) {
        //     query += `WHERE ${whereClause} `;
        // }

        if (!count) {
            values.push(offset);
            values.push(limit);
            query += `ORDER BY brid ASC OFFSET $${values.length - 1} LIMIT $${values.length }`;
        }
        console.log("query is:::", query)
        return {query, values};
    }

    getMerchantQuery(filter, pagination,count, role, userName) {
        let whereClause = '';
        const { bid ,brid,mname,mtype} = filter;
        let values = [];
        const { offset, limit } = pagination;
        values.push(userName);
    
        let query = count ? rolesAccess[`${role}`].getMerchantCount : rolesAccess[`${role}`].getMerchantList;


        if (bid) {
            values.push(bid);
            query += ` AND m.bid = $${values.length}`;
        }
        if (brid) {
            values.push(brid);
            query += ` AND m.brid = ANY($${values.length}::int[]) `;
        }

        if (mname){
            values.push(mname);
            query += ` AND m.mname ILIKE '%' || $${values.length} || '%' `;
        }

        if (mtype){
            values.push(mtype);
            query += ` AND mtid = (SELECT mt.mtid FROM registry.merchant_types mt WHERE mt.merchant_type = $${values.length}) `;
        }

    
        if (!count) {
            values.push(offset);
            values.push(limit);
            query += ` GROUP BY m.mpid, m.mname ORDER BY m.mpid ASC OFFSET $${values.length - 1} LIMIT $${values.length } `;
        }
        return { query, values };
    }



    // getMerchantQuery(filter, pagination,count) {
    //     let whereClause = '';
    //     const { bid ,brid,mname} = filter;
    //     let values = [];
    //     const { offset, limit } = pagination;

    
    //     if (bid) {
    //         values.push(bid);
    //         whereClause += `m.bid = $${values.length}`;
    //     }
    //     if (brid) {
    //         values.push(brid);
    //         whereClause += whereClause ? ' AND ' : '';
    //         whereClause += `m.brid = ANY($${values.length}::int[])`;
    //     }

    //     if (mname){
    //         values.push(mname);
    //         whereClause += whereClause ? ' AND ' : '';
    //         whereClause += `m.mname ILIKE '%' || $${values.length} || '%'`;
    //     }



    //     const selectClause = count? `count(m.mpid)`:`m.mpid AS merchant_id,m.mname AS merchant `;
    
    //     let query = `SELECT ${selectClause} FROM
    //                  registry.merchants m  `;
    
    //     if (whereClause) {
    //         query +=` WHERE ${whereClause} AND m.isd = false AND m.isa = true `;
    //     }
    
    //     if (!count) {
    //         values.push(offset);
    //         values.push(limit);
    //         query += `ORDER BY brid ASC OFFSET $${values.length - 1} LIMIT $${values.length }`;
    //     }
    //     console.log("query is:::", query)
    //     return { query, values };
    // }


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

    status(data){
        const query='SELECT status FROM registry.status WHERE context = $1 ORDER BY priority ASC';
        const values = [data.context]
        return{query,values}
    }


    async upermissions(body) {
        const { username, banks, branches,fname,lname,urole,enabled = false} = body;

        const allowBanks = banks?.allow || [];
        const denyBanks = banks?.deny || [];
    
        const allowBranches = branches?.allow || [];
        const denyBranches = branches?.deny || [];
    
        const query = `
            SELECT *
            FROM registry.add_user_permissions($1, $2, $3, $4, $5, $6, $7, $8, $9);
        `;
        const values = [
            username,allowBanks, denyBanks,
            allowBranches, denyBranches,
            fname, lname,urole,enabled
        ];
        return { query, values };
    }

    async getorgs(){
        const query = 'SELECT oid,oname FROM registry.orgs WHERE isa = true AND isd = false ORDER by oid'
        return query
    }

    async getMerchantTypes(){
        const query = 'SELECT mtid,merchant_type FROM registry.merchant_types WHERE isd = false ORDER by mtid'
        return query
    }

    async getSimProviders(){
        const query = 'SELECT spid,sim_provider FROM registry.sim_providers WHERE isd = false ORDER by spid'
        return query
    }

    async getUserList(body,count){
        const {username,roles,context,search,offset=0,limit=10} = body;
        console.log(body)
        let values = [username,roles,context];
        let whereClause = '';

        if (search) {
            values.push(search);
            whereClause += ` AND (username ILIKE '%' || $${values.length} || '%' OR fname ILIKE '%' || $${values.length} || '%' OR lname ILIKE '%' || $${values.length} || '%')`;
        }

        const selectClause = count ? `count(distinct (username))` : `distinct username,fname, lname`;

        let query = `SELECT ${selectClause} FROM registry.upermissions WHERE urole = ANY($2) AND isd = false AND context = $3 AND context_id IN (SELECT context_id FROM registry.upermissions WHERE username = $1 AND context = $3 AND isd = false)`;
        query += whereClause;

       
        query +=count ? '' : ` ORDER BY username ASC OFFSET ${offset} LIMIT ${limit}`;
        

        return {query, values};
    }


    async getSoundboxesQuery(filter,pagination,role, username){
        const { identifier,paired } = filter;
        const { offset, limit } = pagination;
        let values = [];
        values.push(identifier);
        values.push(offset,limit);
        let mainQuery = `SELECT d.dname,d.imei,mf.mfname
                        FROM registry.devices d
                        JOIN registry.sb s ON d.did = s.did
                        JOIN registry.dtypes dt ON d.dtid = dt.dtid
                        JOIN registry.mf mf ON mf.mfid = d.mfid
                        WHERE dt.dtname ='STD'`

        // let query = rolesAccess[`${role}`].getSoundboxList;

        if (paired) {
            mainQuery += ` AND d.did in (select sdid FROM registry.sb_pair where pdid IN (select did from registry.devices where dname= $1))`;
        }
        else{
            mainQuery += ` AND s.mid = (
                            SELECT s2.mid
                            FROM registry.devices d2
                            JOIN registry.sb s2 ON d2.did = s2.did
                            WHERE d2.dname = $1
                        )
                        AND d.did not in (select sdid FROM registry.sb_pair where pdid IN (select did from registry.devices where dname= $1))`;
        }

        mainQuery += `  ORDER BY d.dname ASC OFFSET $2 LIMIT $3 `;


        let query = `${mainQuery}`;

        return {query, values};
    }

    async getPdQuery(data,count) {
        const {imei} = data.filter
        let values = [imei];

        let query = count ? `select count(did)` : `select dname AS identifier `;

        query += ` from registry.devices where did IN (select pdid from registry.sb_pair where sdid = (select did from registry.devices where imei = $1))`;
        return {query, values};
    }
}
