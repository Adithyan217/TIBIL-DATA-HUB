export const rolesAccess = {
    "DMS Admin": {
            getBankCount: "SELECT count(bid) FROM registry.banks WHERE isd = FALSE AND bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')",
            getBankList: "SELECT bid, bname FROM registry.banks WHERE isd = FALSE AND isa = true AND bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')",
            getBankDetails: "SELECT bid, bname, baddr, binfo,(SELECT count(*) FROM registry.branches WHERE registry.branches.bid = registry.banks.bid AND isd = false AND isa = true AND bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')) AS branch_count FROM registry.banks WHERE bname = $2 AND isd = false AND isa = true AND bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')",
            getBranchCount: "SELECT count(brid) FROM registry.branches WHERE isd = FALSE AND isa = true AND brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')",
            getBranchList: "SELECT brid,brname FROM registry.branches WHERE isd = FALSE AND isa = true AND brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH') ",
            getBranchDetails: "SELECT br.brid, br.brname, br.braddr, br.brinfo, b.bname FROM registry.branches br JOIN registry.banks b ON b.bid=br.bid WHERE br.isd = false AND br.isa = true AND br.brname = $2 AND br.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')",
            getDeviceCount:`SELECT count(s.did) FROM registry.sb s LEFT JOIN registry.vpa v ON v.vid = s.vid LEFT JOIN registry.merchants m ON m.mpid = s.mid LEFT JOIN registry.devices d ON d.did = s.did JOIN registry.dtypes dt ON dt.dtid = d.dtid
                             WHERE d.isd = false AND d.isa = true AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL)OR s.bid IS NULL)`,
            getDeviceList:`SELECT dt.dtname AS dtype,d.dname AS device_id, v.vpa AS vpa_id, m.mname AS merchant,d.imei,d.did,d.sbe FROM registry.sb s LEFT JOIN registry.vpa v ON v.vid = s.vid LEFT JOIN registry.merchants m ON m.mpid = s.mid LEFT JOIN registry.devices d ON d.did = s.did JOIN registry.dtypes dt ON dt.dtid = d.dtid
                            WHERE d.isd = false AND d.isa = true AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL)OR s.bid IS NULL)`, 
            getDeviceDetails:`SELECT  
                    d.did ,
                    l.lname,
                    dt.dtname AS device_type,
                    d.lid,
                    d.imei ,
                    d.sbe ,
                    r.rcontext,
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
                LEFT JOIN registry.routes r ON mf.mfid = r.mfid
				JOIN registry.mf_language l ON d.lid = l.lid                
                JOIN registry.dtypes dt ON dt.dtid = d.dtid
                WHERE d.dname = $2 AND d.isd = false AND d.isa = true
                AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') 	AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH'))OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL)OR s.bid IS NULL);`,
            getDeviceTelemetry:`SELECT tdetails,uat AS last_seen FROM registry.tlog t
                JOIN registry.devices d ON t.imei = d.imei
                JOIN registry.sb s ON d.did = s.did
                WHERE d.dname = $2 
                AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL)OR s.bid IS NULL);`,
            getDevicePaymentsCount:`SELECT COUNT(p.rrn) 
                FROM registry.plog p
                JOIN registry.devices d ON p.imei = d.imei
                JOIN registry.sb s ON d.did = s.did 
                where d.dname = $2 AND p.cat >= $3::date AND p.cat < $4::date
                AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL)OR s.bid IS NULL);`,
            getDevicePayments:`SELECT p.rrn, p.imei, p.cat AS received_at, p.txnamt AS amount,
                CASE WHEN status = 'RECEIVED_ACK_FROM_DEVICE' THEN
                'success' ELSE
                'FAILURE' 
                END AS Announcement_status
                FROM registry.plog p
                JOIN registry.devices d ON p.imei = d.imei
                JOIN registry.sb s ON d.did = s.did 
                where d.dname = $2 AND p.cat >= $3::date AND p.cat < $4::date
                AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL)OR s.bid IS NULL)
                LIMIT $5 OFFSET $6;`,
            getMerchantCount: `SELECT count(mpid) FROM registry.merchants m WHERE 
                                    m.isd = FALSE 
                                    AND m.isa = TRUE 
                                    AND m.bid IN (
                                        SELECT context_id 
                                        FROM registry.upermissions 
                                        WHERE isd = FALSE 
                                        AND username = $1 
                                        AND context = 'BANK'
                                    )
                                    AND m.brid IN (
                                        SELECT context_id 
                                        FROM registry.upermissions 
                                        WHERE isd = FALSE 
                                        AND username = $1 
                                        AND context = 'BRANCH'
                                    ) `,
            getMerchantList: `SELECT 
                                m.mpid AS merchant_id,
                                m.mname AS merchant,
                                (
                                    SELECT COUNT(*) 
                                    FROM registry.sb s 
                                    WHERE s.mid = m.mpid
                                ) AS allocated_devices
                                FROM registry.merchants m
                                WHERE 
                                m.isd = FALSE 
                                AND m.isa = TRUE 
                                AND m.bid IN (
                                    SELECT context_id 
                                    FROM registry.upermissions 
                                    WHERE isd = FALSE 
                                    AND username = $1 
                                    AND context = 'BANK'
                                )
                                AND m.brid IN (
                                    SELECT context_id 
                                    FROM registry.upermissions 
                                    WHERE isd = FALSE 
                                    AND username = $1 
                                    AND context = 'BRANCH'
                                )
                            `
        }, 
    "Bank Admin":{
        getBankCount: "SELECT count(bid) FROM registry.banks WHERE isd = FALSE AND bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')",
        getBankList: "SELECT bid, bname FROM registry.banks WHERE isd = FALSE AND isa = true AND bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')",
        getBankDetails: "SELECT bid, bname, baddr, binfo,(SELECT count(*) FROM registry.branches WHERE registry.branches.bid = registry.banks.bid AND isd = false AND isa = true AND bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')) AS branch_count FROM registry.banks WHERE bname = $2 AND isd = false AND isa = true AND bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')",
        getBranchCount: "SELECT count(brid) FROM registry.branches WHERE isd = FALSE AND isa = true AND brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')",
        getBranchList: "SELECT brid,brname FROM registry.branches WHERE isd = FALSE AND isa = true AND brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH') ",
        getBranchDetails: "SELECT br.brid, br.brname, br.braddr, br.brinfo, b.bname FROM registry.branches br JOIN registry.banks b ON b.bid=br.bid WHERE br.isd = false AND br.isa = true AND br.brname = $2 AND br.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')",
        getDeviceCount:`SELECT count(s.did) FROM registry.sb s LEFT JOIN registry.vpa v ON v.vid = s.vid LEFT JOIN registry.merchants m ON m.mpid = s.mid LEFT JOIN registry.devices d ON d.did = s.did JOIN registry.dtypes dt ON dt.dtid = d.dtid
                        WHERE d.isd = false AND d.isa = true AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL))`,
        getDeviceList:`SELECT d.dname AS device_id, v.vpa AS vpa_id, m.mname AS merchant,d.imei,d.did FROM registry.sb s LEFT JOIN registry.vpa v ON v.vid = s.vid LEFT JOIN registry.merchants m ON m.mpid = s.mid LEFT JOIN registry.devices d ON d.did = s.did JOIN registry.dtypes dt ON dt.dtid = d.dtid
                        WHERE d.isd = false AND d.isa = true AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL))`, 
        getDeviceDetails:`SELECT  
                d.did,
                l.lname,
                dt.dtname AS device_type,
                d.lid,
                d.imei ,
                d.sbe ,
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
            JOIN registry.mf_language l ON d.lid = l.lid
            JOIN registry.dtypes dt ON dt.dtid = d.dtid
            WHERE d.dname = $2 AND d.isd = false AND d.isa = true
            AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') 	AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH'))OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')AND s.brid IS NULL));`,
        getDeviceTelemetry:`SELECT tdetails,uat AS last_seen FROM registry.tlog t
            JOIN registry.devices d ON t.imei = d.imei
            JOIN registry.sb s ON d.did = s.did
            WHERE d.dname = $2 
            AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL));` ,
        getDevicePaymentsCount:`SELECT COUNT(p.rrn) 
                FROM registry.plog p
                JOIN registry.devices d ON p.imei = d.imei
                JOIN registry.sb s ON d.did = s.did 
                where d.dname = $2 AND p.cat >= $3::date AND p.cat < $4::date
                AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL));`,
        getDevicePayments:`SELECT p.rrn, p.imei, p.cat AS received_at, p.txnamt AS amount,
                CASE WHEN status = 'RECEIVED_ACK_FROM_DEVICE' THEN
                'success' ELSE
                'FAILURE' 
                END AS Announcement_status
                FROM registry.plog p
                JOIN registry.devices d ON p.imei = d.imei
                JOIN registry.sb s ON d.did = s.did 
                where d.dname = $2 AND p.cat >= $3::date AND p.cat < $4::date
                AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL))
                LIMIT $5 OFFSET $6;`,
        getMerchantCount: `SELECT count(mpid) FROM registry.merchants m WHERE 
                        m.isd = FALSE 
                        AND m.isa = TRUE 
                        AND m.bid IN (
                            SELECT context_id 
                            FROM registry.upermissions 
                            WHERE isd = FALSE 
                            AND username = $1 
                            AND context = 'BANK'
                        )
                        AND m.brid IN (
                            SELECT context_id 
                            FROM registry.upermissions 
                            WHERE isd = FALSE 
                            AND username = $1 
                            AND context = 'BRANCH'
                        ) `,
        getMerchantList: `SELECT 
                    m.mpid AS merchant_id,
                    m.mname AS merchant,
                    (
                        SELECT COUNT(*) 
                        FROM registry.sb s 
                        WHERE s.mid = m.mpid
                    ) AS allocated_devices
                    FROM registry.merchants m
                    WHERE 
                    m.isd = FALSE 
                    AND m.isa = TRUE 
                    AND m.bid IN (
                        SELECT context_id 
                        FROM registry.upermissions 
                        WHERE isd = FALSE 
                        AND username = $1 
                        AND context = 'BANK'
                    )
                    AND m.brid IN (
                        SELECT context_id 
                        FROM registry.upermissions 
                        WHERE isd = FALSE 
                        AND username = $1 
                        AND context = 'BRANCH'
                    )
                `
    },
    "Bank RM":{
        getBankCount: "SELECT count(bid) FROM registry.banks WHERE isd = FALSE AND bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')",
        getBankList: "SELECT bid, bname FROM registry.banks WHERE isd = FALSE AND isa = true AND bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')",
        getBankDetails: "SELECT bid, bname, baddr, binfo,(SELECT count(*) FROM registry.branches WHERE registry.branches.bid = registry.banks.bid AND isd = false AND isa = true AND bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')) AS branch_count FROM registry.banks WHERE bname = $2 AND isd = false AND isa = true AND bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')",
        getBranchCount: "SELECT count(brid) FROM registry.branches WHERE isd = FALSE AND isa = true AND brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')",
        getBranchList: "SELECT brid,brname FROM registry.branches WHERE isd = FALSE AND isa = true AND brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH') ",
        getBranchDetails: "SELECT br.brid, br.brname, br.braddr, br.brinfo, b.bname FROM registry.branches br JOIN registry.banks b ON b.bid=br.bid WHERE br.isd = false AND br.isa = true AND br.brname = $2 AND br.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')",
        getDeviceCount:`SELECT count(s.did) FROM registry.sb s LEFT JOIN registry.vpa v ON v.vid = s.vid LEFT JOIN registry.merchants m ON m.mpid = s.mid LEFT JOIN registry.devices d ON d.did = s.did JOIN registry.dtypes dt ON dt.dtid = d.dtid
                        WHERE d.isd = false AND d.isa = true AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL))`,
        getDeviceList:`SELECT d.dname AS device_id, v.vpa AS vpa_id, m.mname AS merchant,d.imei,d.did FROM registry.sb s LEFT JOIN registry.vpa v ON v.vid = s.vid LEFT JOIN registry.merchants m ON m.mpid = s.mid LEFT JOIN registry.devices d ON d.did = s.did JOIN registry.dtypes dt ON dt.dtid = d.dtid
                        WHERE d.isd = false AND d.isa = true AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL))`, 
        getDeviceDetails:`SELECT  
                d.did,
                l.lname,
                dt.dtname AS device_type,
                d.lid,
                d.imei ,
                d.sbe ,
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
            JOIN registry.dtypes dt ON dt.dtid = d.dtid
            JOIN registry.mf_language l ON d.lid = l.lid
            WHERE d.dname = $2 AND d.isd = false AND d.isa = true
            AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') 	AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH'))OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')AND s.brid IS NULL));`,
        getDeviceTelemetry:`SELECT tdetails,uat AS last_seen FROM registry.tlog t
            JOIN registry.devices d ON t.imei = d.imei
            JOIN registry.sb s ON d.did = s.did
            WHERE d.dname = $2 
            AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL));` ,
        getDevicePaymentsCount:`SELECT COUNT(p.rrn) 
                FROM registry.plog p
                JOIN registry.devices d ON p.imei = d.imei
                JOIN registry.sb s ON d.did = s.did 
                where d.dname = $2 AND p.cat >= $3::date AND p.cat < $4::date
                AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL));`,
        getDevicePayments:`SELECT p.rrn, p.imei, p.cat AS received_at, p.txnamt AS amount,
                CASE WHEN status = 'RECEIVED_ACK_FROM_DEVICE' THEN
                'success' ELSE
                'FAILURE' 
                END AS Announcement_status
                FROM registry.plog p
                JOIN registry.devices d ON p.imei = d.imei
                JOIN registry.sb s ON d.did = s.did 
                where d.dname = $2 AND p.cat >= $3::date AND p.cat < $4::date
                AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL))
                LIMIT $5 OFFSET $6;`,
        getMerchantCount: `SELECT count(mpid) FROM registry.merchants m WHERE 
                        m.isd = FALSE 
                        AND m.isa = TRUE 
                        AND m.bid IN (
                            SELECT context_id 
                            FROM registry.upermissions 
                            WHERE isd = FALSE 
                            AND username = $1 
                            AND context = 'BANK'
                        )
                        AND m.brid IN (
                            SELECT context_id 
                            FROM registry.upermissions 
                            WHERE isd = FALSE 
                            AND username = $1 
                            AND context = 'BRANCH'
                        ) `,
        getMerchantList: `SELECT 
                    m.mpid AS merchant_id,
                    m.mname AS merchant,
                    (
                        SELECT COUNT(*) 
                        FROM registry.sb s 
                        WHERE s.mid = m.mpid
                    ) AS allocated_devices
                    FROM registry.merchants m
                    WHERE 
                    m.isd = FALSE 
                    AND m.isa = TRUE 
                    AND m.bid IN (
                        SELECT context_id 
                        FROM registry.upermissions 
                        WHERE isd = FALSE 
                        AND username = $1 
                        AND context = 'BANK'
                    )
                    AND m.brid IN (
                        SELECT context_id 
                        FROM registry.upermissions 
                        WHERE isd = FALSE 
                        AND username = $1 
                        AND context = 'BRANCH'
                    )
                `
            
    },
    "CO Bank Admin":{
        getBankCount: "SELECT count(bid) FROM registry.banks WHERE isd = FALSE AND bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')",
        getBankList: "SELECT bid, bname FROM registry.banks WHERE isd = FALSE AND isa = true AND bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')",
        getBankDetails: "SELECT bid, bname, baddr, binfo,(SELECT count(*) FROM registry.branches WHERE registry.branches.bid = registry.banks.bid AND isd = false AND isa = true AND bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')) AS branch_count FROM registry.banks WHERE bname = $2 AND isd = false AND isa = true AND bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')",
        getBranchCount: "SELECT count(brid) FROM registry.branches WHERE isd = FALSE AND isa = true AND brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')",
        getBranchList: "SELECT brid,brname FROM registry.branches WHERE isd = FALSE AND isa = true AND brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH') ",
        getBranchDetails: "SELECT br.brid, br.brname, br.braddr, br.brinfo, b.bname FROM registry.branches br JOIN registry.banks b ON b.bid=br.bid WHERE br.isd = false AND br.isa = true AND br.brname = $2 AND br.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')",
        getDeviceCount:`SELECT count(s.did) FROM registry.sb s LEFT JOIN registry.vpa v ON v.vid = s.vid LEFT JOIN registry.merchants m ON m.mpid = s.mid LEFT JOIN registry.devices d ON d.did = s.did JOIN registry.dtypes dt ON dt.dtid = d.dtid
                        WHERE d.isd = false AND d.isa = true AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL))`,
        getDeviceList:`SELECT d.dname AS device_id, v.vpa AS vpa_id, m.mname AS merchant,d.imei,d.did FROM registry.sb s LEFT JOIN registry.vpa v ON v.vid = s.vid LEFT JOIN registry.merchants m ON m.mpid = s.mid LEFT JOIN registry.devices d ON d.did = s.did JOIN registry.dtypes dt ON dt.dtid = d.dtid
                        WHERE d.isd = false AND d.isa = true AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL))`, 
        getDeviceDetails:`SELECT  
                d.did,
                l.lname,
                dt.dtname AS device_type,
                d.lid,
                d.imei ,
                d.sbe ,
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
            JOIN registry.mf_language l ON d.lid = l.lid
            JOIN registry.dtypes dt ON dt.dtid = d.dtid
            WHERE d.dname = $2 AND d.isd = false AND d.isa = true
            AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') 	AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH'))OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')AND s.brid IS NULL));`,
        getDeviceTelemetry:`SELECT tdetails,uat AS last_seen FROM registry.tlog t
            JOIN registry.devices d ON t.imei = d.imei
            JOIN registry.sb s ON d.did = s.did
            WHERE d.dname = $2 
            AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL));` ,
        getDevicePaymentsCount:`SELECT COUNT(p.rrn) 
                FROM registry.plog p
                JOIN registry.devices d ON p.imei = d.imei
                JOIN registry.sb s ON d.did = s.did 
                where d.dname = $2 AND p.cat >= $3::date AND p.cat < $4::date
                AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL));`,
        getDevicePayments:`SELECT p.rrn, p.imei, p.cat AS received_at, p.txnamt AS amount,
                CASE WHEN status = 'RECEIVED_ACK_FROM_DEVICE' THEN
                'success' ELSE
                'FAILURE' 
                END AS Announcement_status
                FROM registry.plog p
                JOIN registry.devices d ON p.imei = d.imei
                JOIN registry.sb s ON d.did = s.did 
                where d.dname = $2 AND p.cat >= $3::date AND p.cat < $4::date
                AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL))
                LIMIT $5 OFFSET $6;`,
        getMerchantCount: `SELECT count(mpid) FROM registry.merchants m WHERE 
                        m.isd = FALSE 
                        AND m.isa = TRUE 
                        AND m.bid IN (
                            SELECT context_id 
                            FROM registry.upermissions 
                            WHERE isd = FALSE 
                            AND username = $1 
                            AND context = 'BANK'
                        )
                        AND m.brid IN (
                            SELECT context_id 
                            FROM registry.upermissions 
                            WHERE isd = FALSE 
                            AND username = $1 
                            AND context = 'BRANCH'
                        ) `,
        getMerchantList: `SELECT 
                    m.mpid AS merchant_id,
                    m.mname AS merchant,
                    (
                        SELECT COUNT(*) 
                        FROM registry.sb s 
                        WHERE s.mid = m.mpid
                    ) AS allocated_devices
                    FROM registry.merchants m
                    WHERE 
                    m.isd = FALSE 
                    AND m.isa = TRUE 
                    AND m.bid IN (
                        SELECT context_id 
                        FROM registry.upermissions 
                        WHERE isd = FALSE 
                        AND username = $1 
                        AND context = 'BANK'
                    )
                    AND m.brid IN (
                        SELECT context_id 
                        FROM registry.upermissions 
                        WHERE isd = FALSE 
                        AND username = $1 
                        AND context = 'BRANCH'
                    )
                `
    },
    "CO Bank RM":{
        getBankCount: "SELECT count(bid) FROM registry.banks WHERE isd = FALSE AND bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')",
        getBankList: "SELECT bid, bname FROM registry.banks WHERE isd = FALSE AND isa = true AND bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')",
        getBankDetails: "SELECT bid, bname, baddr, binfo,(SELECT count(*) FROM registry.branches WHERE registry.branches.bid = registry.banks.bid AND isd = false AND isa = true AND bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')) AS branch_count FROM registry.banks WHERE bname = $2 AND isd = false AND isa = true AND bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')",
        getBranchCount: "SELECT count(brid) FROM registry.branches WHERE isd = FALSE AND isa = true AND brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')",
        getBranchList: "SELECT brid,brname FROM registry.branches WHERE isd = FALSE AND isa = true AND brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH') ",
        getBranchDetails: "SELECT br.brid, br.brname, br.braddr, br.brinfo, b.bname FROM registry.branches br JOIN registry.banks b ON b.bid=br.bid WHERE br.isd = false AND br.isa = true AND br.brname = $2 AND br.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')",
        getDeviceCount:`SELECT count(s.did) FROM registry.sb s LEFT JOIN registry.vpa v ON v.vid = s.vid LEFT JOIN registry.merchants m ON m.mpid = s.mid LEFT JOIN registry.devices d ON d.did = s.did JOIN registry.dtypes dt ON dt.dtid = d.dtid
                        WHERE d.isd = false AND d.isa = true AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL))`,
        getDeviceList:`SELECT d.dname AS device_id, v.vpa AS vpa_id, m.mname AS merchant,d.imei,d.did FROM registry.sb s LEFT JOIN registry.vpa v ON v.vid = s.vid LEFT JOIN registry.merchants m ON m.mpid = s.mid LEFT JOIN registry.devices d ON d.did = s.did JOIN registry.dtypes dt ON dt.dtid = d.dtid
                        WHERE d.isd = false AND d.isa = true AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL))`, 
        getDeviceDetails:`SELECT  
                d.did,
                l.lname,
                dt.dtname AS device_type,
                d.lid,
                d.imei ,
                d.sbe ,
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
            JOIN registry.mf_language l ON d.lid = l.lid
            JOIN registry.dtypes dt ON dt.dtid = d.dtid
            WHERE d.dname = $2 AND d.isd = false AND d.isa = true
            AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') 	AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH'))OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK')AND s.brid IS NULL));`,
        getDeviceTelemetry:`SELECT tdetails,uat AS last_seen FROM registry.tlog t
            JOIN registry.devices d ON t.imei = d.imei
            JOIN registry.sb s ON d.did = s.did
            WHERE d.dname = $2 
            AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL));` ,
        getDevicePaymentsCount:`SELECT COUNT(p.rrn) 
                FROM registry.plog p
                JOIN registry.devices d ON p.imei = d.imei
                JOIN registry.sb s ON d.did = s.did 
                where d.dname = $2 AND p.cat >= $3::date AND p.cat < $4::date
                AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL));`,
        getDevicePayments:`SELECT p.rrn, p.imei, p.cat AS received_at, p.txnamt AS amount,
                CASE WHEN status = 'RECEIVED_ACK_FROM_DEVICE' THEN
                'success' ELSE
                'FAILURE' 
                END AS Announcement_status
                FROM registry.plog p
                JOIN registry.devices d ON p.imei = d.imei
                JOIN registry.sb s ON d.did = s.did 
                where d.dname = $2 AND p.cat >= $3::date AND p.cat < $4::date
                AND ((s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BRANCH')) OR (s.bid IN (SELECT context_id FROM registry.upermissions WHERE  isd = false AND username = $1 AND context = 'BANK') AND s.brid IS NULL))
                LIMIT $5 OFFSET $6;`,
        getMerchantCount: `SELECT count(mpid) FROM registry.merchants m WHERE 
                m.isd = FALSE 
                AND m.isa = TRUE 
                AND m.bid IN (
                    SELECT context_id 
                    FROM registry.upermissions 
                    WHERE isd = FALSE 
                    AND username = $1 
                    AND context = 'BANK'
                )
                AND m.brid IN (
                    SELECT context_id 
                    FROM registry.upermissions 
                    WHERE isd = FALSE 
                    AND username = $1 
                    AND context = 'BRANCH'
                ) `,
        getMerchantList: `SELECT 
                    m.mpid AS merchant_id,
                    m.mname AS merchant,
                    (
                        SELECT COUNT(*) 
                        FROM registry.sb s 
                        WHERE s.mid = m.mpid
                    ) AS allocated_devices
                    FROM registry.merchants m
                    WHERE 
                    m.isd = FALSE 
                    AND m.isa = TRUE 
                    AND m.bid IN (
                        SELECT context_id 
                        FROM registry.upermissions 
                        WHERE isd = FALSE 
                        AND username = $1 
                        AND context = 'BANK'
                    )
                    AND m.brid IN (
                        SELECT context_id 
                        FROM registry.upermissions 
                        WHERE isd = FALSE 
                        AND username = $1 
                        AND context = 'BRANCH'
                    )
                `
    },
    "MSB Guest":{
        getDeviceDetails:`SELECT  
                d.did,
                dt.dtname AS device_type,
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
            JOIN registry.dtypes dt ON dt.dtid = d.dtid
            WHERE (d.dname = $1 AND d.isd = false AND d.isa = true) 
            `,
        getBankDetails: "SELECT bid, bname, baddr, binfo, logo FROM registry.banks WHERE bname = $1 AND isd = false AND isa = true",

    },
    "MSB-User":{
        getDevicePaymentsCount:`SELECT COUNT(DISTINCT b.rrn) 
                FROM registry.blog b
                JOIN registry.devices d ON b.imei = d.imei
                JOIN registry.sb s ON d.did = s.did 
                where d.imei = $1 AND b.status = 'PUSHED_NOTIF_TO_FB' AND b.cat >= $2::date AND b.cat < $3::date`,
        getDevicePayments:`SELECT b.rrn, b.imei, b.cat AS received_at, b.txnamt AS amount,
                CASE WHEN status = 'PUSHED_NOTIF_TO_FB' THEN
                'success' ELSE
                'FAILURE' 
                END AS Announcement_status
                FROM registry.blog b
                JOIN registry.devices d ON b.imei = d.imei
                JOIN registry.sb s ON d.did = s.did 
                where d.imei = $1 AND b.cat >= $2::date AND b.cat < $3::date
                LIMIT $4 OFFSET $5;`,
    }
}






            