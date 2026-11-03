entityQuery(pagination,filter, context, count) {
    const mainQuery = {
        bank: {
            query: 
            count && filter.bank_id? `SELECT count(bid) FROM registry.banks WHERE isd = false AND isa = true AND bname ILIKE $1::text`
                :count? `SELECT count(bid) FROM registry.banks WHERE isd = false AND isa = true`       
                : `SELECT bid, bname, baddr, binfo, 
                    (SELECT count(*) FROM registry.branches 
                     WHERE registry.branches.bid = registry.banks.bid 
                     AND isd = false AND isa = true) AS branch_count  
                   FROM registry.banks 
                   WHERE ${filter?.bid ? `bname = $3::text AND` : ``} 
                         ${filter?.bank_id ? `bname ILIKE $3::text AND` : ``} 
                         isd = false  
                   ORDER BY bid ASC 
                   OFFSET $1 LIMIT $2`,
            
            value:count && filter.bank_id
            ? [`%${filter.bank_id}%`]
            :count 
                ? [] 
                
                : filter?.bank_id 
                    ? [pagination.offset, pagination.limit, `%${filter.bank_id}%`]  // Properly formatted for ILIKE
                    : filter?.bid 
                        ? [pagination.offset, pagination.limit, filter.bid] 
                        : [pagination.offset, pagination.limit] 
        }
        ,
        branch: {
            query: count
              ? `SELECT count(brid) FROM registry.branches WHERE isd = false AND isa = true${filter?.bid ? " AND bid =(SELECT b.bid FROM registry.banks b WHERE bname = $1)" : ""}`
              : `SELECT br.brid, br.brname, br.braddr, br.brinfo,b.bname FROM registry.branches br JOIN registry.banks b ON b.bid=br.bid WHERE br.isd = false AND br.isa = true${filter?.bid ? " AND br.bid = (SELECT b.bid FROM registry.banks b WHERE bname =$3)" : ""} ORDER BY brid ASC OFFSET $1 LIMIT $2`,
            value: count ? (filter.bid ? [filter.bid] : []) : (filter.bid ? [pagination.offset, pagination.limit, filter.bid] : [pagination.offset, pagination.limit])
        },
        firmware: {
            query: count ?
            `SELECT count(fid) FROM registry.firmware WHERE mfid =(SELECT mf.mfid FROM registry.mf WHERE mfname= $1) AND isd = false `
            :
            `select f.fid, f.fname, fv.eat FROM registry.firmware as f JOIN registry.firmware_v as fv ON fv.fid = f.fid WHERE f.isd = FALSE AND  fv.op = $1 AND f.mfid =(SELECT mf.mfid FROM registry.mf WHERE mfname=  $2) ORDER BY fid ASC OFFSET $3 LIMIT $4`,
            value: count? [filter.mfid]:  ['CREATED', filter.mfid, pagination.offset, pagination.limit]
        },
        manufacturer: {
            query: `SELECT ${count? ` count(mfid) ` : ` mfid, mfname, mfaddr, mfinfo` } FROM  registry.mf WHERE isd = false  ${count? ``:` ORDER BY mfname ASC OFFSET $1 LIMIT $2`}`,
            value: count? []:  [pagination.offset, pagination.limit]
        },
        model: {
            query: count ?
             `SELECT count(mdid) FROM registry.model WHERE mfid =(SELECT mf.mfid FROM registry.mf WHERE mfname=  $1 )AND isd = false `
             :
             `select md.mdid, md.mdname, mdv.eat FROM registry.model as md JOIN registry.model_v as mdv ON mdv.mdid = md.mdid WHERE md.isd = FALSE AND mdv.op = $1 AND md.mfid =(SELECT mf.mfid FROM registry.mf WHERE mfname= $2) ORDER BY mdid ASC  OFFSET $3 LIMIT $4`,
             value:count? [filter.mfid]:  ['CREATED', filter.mfid, pagination.offset, pagination.limit]
        },
        merchant: {
            query: count && filter.bid && filter.brid ?`SELECT count(mpid) FROM registry.merchants WHERE bid =(SELECT banks.bid FROM registry.banks WHERE bname =  $1) AND brid =(SELECT branches.brid FROM registry.branches WHERE brname = $2) AND isd = false AND isa = true`
                :count && filter.mname
                ? `SELECT count(mpid)
                   FROM registry.merchants 
                   WHERE bid =(SELECT b.bid FROM registry.banks b WHERE bname =  $1) AND mname = $2 AND isd = false AND isa = true`
                : count 
                    ? `SELECT count(mpid)
                        FROM registry.merchants 
                        WHERE bid=(SELECT b.bid FROM registry.banks b WHERE bname =  $1 ) AND isd = false AND isa = true`
                    : filter.mname
                        ? `SELECT mpid, mname, minfo, maddr 
                           FROM registry.merchants 
                           WHERE isd = false AND isa = true AND mname = $1 AND bid =(SELECT b.bid FROM registry.banks b WHERE bname = $2)
                           ORDER BY mpid ASC OFFSET $3 LIMIT $4`
                        : filter.brid? `SELECT mpid, mname, minfo, maddr
                                      FROM registry.merchants
                                      WHERE isd = false AND isa = true AND brid =(SELECT branches.brid FROM registry.branches WHERE brname = $1) AND bid =(SELECT b.bid FROM registry.banks b WHERE bname = $2)
                                      ORDER BY mpid ASC OFFSET $3 LIMIT $4`
                        : `SELECT mpid, mname, minfo, maddr 
                           FROM registry.merchants 
                           WHERE isd = false AND isa = true AND bid =(SELECT b.bid FROM registry.banks b WHERE bname = $1) 
                           ORDER BY mpid ASC OFFSET $2 LIMIT $3`,
            value: count && filter.bid && filter.brid ? [filter.bid, filter.brid]
            : count && filter.mname
                ? [ filter.bid,filter.mname]
                : count 
                    ? [filter.bid]
                    : filter.mname
                        ? [filter.mname, filter.bid, pagination.offset , pagination.limit]
                        :filter.brid? [filter.brid,filter.bid, pagination.offset , pagination.limit ]:[filter.bid, pagination.offset , pagination.limit ]
        }
        
        
        
        
    }
    return mainQuery[context]
}