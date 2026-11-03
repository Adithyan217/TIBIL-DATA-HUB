------------BANK METRICS

CREATE OR REPLACE FUNCTION intel.bank_metrics(uname VARCHAR)
RETURNS TABLE (mname TEXT, mvalue BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 'bank_cnt' AS mname, COUNT(*) AS mvalue
    FROM registry.banks
    WHERE isd = false AND isa = true AND bid IN (SELECT context_id FROM registry.upermissions WHERE username = uname AND context = 'BANK')
    UNION ALL
    SELECT 'branch_cnt', COUNT(*)
    FROM registry.branches
    WHERE isd = false AND isa = true AND brid IN (SELECT context_id FROM registry.upermissions WHERE username = uname AND context = 'BRANCH')
    UNION ALL
    SELECT 'merchant_cnt', COUNT(*)
    FROM registry.merchants
    WHERE isd = false AND isa = true AND mpid IN (SELECT context_id FROM registry.upermissions WHERE username = uname AND context = 'MERCHANT');
END
$$ LANGUAGE plpgsql;

SELECT * from intel.bank_metrics('dhanush.ks@tibilsolutions.com')

----------------------------PAYMENT METRICS

CREATE OR REPLACE FUNCTION intel.payment_metrics(uname VARCHAR)
RETURNS TABLE (mname TEXT, mvalue DOUBLE PRECISION) AS $$
BEGIN
    RETURN QUERY
    SELECT 'total_txn' AS mname, COUNT(txnamt)::DOUBLE PRECISION AS mvalue
    FROM registry.plog p
	JOIN registry.devices d ON p.dname = d.imei
	JOIN registry.sb s ON d.did = s.did
	WHERE s.bid IN (SELECT context_id FROM registry.upermissions  WHERE username = uname AND context = 'BANK' )
	AND s.brid IN (SELECT context_id FROM registry.upermissions  WHERE username = uname AND context = 'BRANCH' )
    UNION ALL
    SELECT 'total_amt', COALESCE(SUM(txnamt), 0)
        FROM registry.plog p
	JOIN registry.devices d ON p.dname = d.imei
	JOIN registry.sb s ON d.did = s.did
	WHERE s.bid IN (SELECT context_id FROM registry.upermissions  WHERE username = uname AND context = 'BANK' )
	AND s.brid IN (SELECT context_id FROM registry.upermissions  WHERE username = uname AND context = 'BRANCH' );
END
$$ LANGUAGE plpgsql;

SELECT * FROM intel.payment_metrics('dhanush.ks@tibilsolutions.com')


-------------------------------DEVICE METRICS

CREATE OR REPLACE FUNCTION intel.device_metrics(uname VARCHAR, urole VARCHAR)
RETURNS TABLE (mname TEXT, mvalue BIGINT) AS $$
BEGIN
    IF urole = 'DMS Admin' THEN
        RETURN QUERY
        SELECT 'total_device_cnt' AS mname, COUNT(sb.did) AS mvalue
        FROM registry.sb AS sb
        JOIN registry.devices AS d ON sb.did = d.did
        WHERE d.isd = false AND d.isa = true
        AND ((sb.bid IN (SELECT context_id FROM registry.upermissions WHERE username = uname AND context = 'BANK')
            AND sb.brid IN (SELECT context_id FROM registry.upermissions WHERE username = uname AND context = 'BRANCH'))
            OR sb.bid IS NULL
        );

        RETURN QUERY
        SELECT 'inventory_cnt', COUNT(sb.did)
        FROM registry.sb AS sb
        JOIN registry.devices AS d ON sb.did = d.did
        WHERE d.isd = false AND d.isa = true
        AND sb.mid IS NULL AND sb.bid IS NULL AND sb.brid IS NULL;

        RETURN QUERY
        SELECT 'allocated_cnt', COUNT(sb.did)
        FROM registry.sb AS sb
        JOIN registry.devices AS d ON sb.did = d.did
        WHERE d.isd = false AND d.isa = true
        AND (
            sb.mid IS NOT NULL OR sb.bid IS NOT NULL OR sb.brid IS NOT NULL
        )
        AND (
            sb.bid IN (SELECT context_id FROM registry.upermissions WHERE username = uname AND context = 'BANK')
            OR sb.brid IN (SELECT context_id FROM registry.upermissions WHERE username = uname AND context = 'BRANCH')
        );
    ELSE
        RETURN QUERY
        SELECT 'total_device_cnt' AS mname, COUNT(sb.did) AS mvalue
        FROM registry.sb AS sb
        JOIN registry.devices AS d ON sb.did = d.did
        WHERE d.isd = false AND d.isa = true
        AND (
            (
                sb.bid IN (SELECT context_id FROM registry.upermissions WHERE username = uname AND context = 'BANK')
                AND sb.brid IN (SELECT context_id FROM registry.upermissions WHERE username = uname AND context = 'BRANCH')
            )
            OR (
                sb.bid IN (SELECT context_id FROM registry.upermissions WHERE username = uname AND context = 'BANK')
                AND sb.brid IS NULL
            )
        );

        RETURN QUERY
        SELECT 'inventory_cnt', COUNT(sb.did)
        FROM registry.sb AS sb
        JOIN registry.devices AS d ON sb.did = d.did
        WHERE d.isd = false AND d.isa = true
		AND ( sb.mid IS NULL AND sb.brid IS NULL)
        AND sb.bid IN (SELECT context_id FROM registry.upermissions WHERE username = uname AND context = 'BANK');

        RETURN QUERY
        SELECT 'allocated_cnt', COUNT(sb.did)
        FROM registry.sb AS sb
        JOIN registry.devices AS d ON sb.did = d.did
        WHERE d.isd = false AND d.isa = true
        AND (
            sb.mid IS NOT NULL OR sb.brid IS NOT NULL
        )
        AND (
            sb.bid IN (SELECT context_id FROM registry.upermissions WHERE username = uname AND context = 'BANK')
            AND sb.brid IN (SELECT context_id FROM registry.upermissions WHERE username = uname AND context = 'BRANCH')
        );
    END IF;
END
$$ LANGUAGE plpgsql;



SELECT * FROM intel.device_metrics('dhanush.ks@tibilsolutions.com','Bank Admin')

-------------------------------------request for devices

----------------- should it only contain the request the user raised or it can be of all the requests under that bank or branch

CREATE OR REPLACE FUNCTION intel.device_request_metrics()
RETURNS TABLE (mname TEXT, mvalue BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 'total' AS mname, COUNT(drid) AS mvalue
    FROM registry.device_requests WHERE 
    UNION ALL
    SELECT 'open', COUNT(drid)
    FROM registry.device_requests
    WHERE status != 'Delivered'
    UNION ALL
    SELECT 'closed', COUNT(drid)
    FROM registry.device_requests
    WHERE status = 'Delivered';
END
$$ LANGUAGE plpgsql;

SELECT * FROM intel.device_request_metrics()
-------------------------device issues

CREATE OR REPLACE FUNCTION intel.device_issues_metrics()
RETURNS TABLE (mname TEXT, mvalue BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 'total' AS mname, COUNT(iid) AS mvalue
    FROM registry.device_issues
    UNION ALL
    SELECT 'open', COUNT(iid)
    FROM registry.device_issues
    WHERE status = 'Open'
    UNION ALL
    SELECT 'closed', COUNT(iid)
    FROM registry.device_issues
    WHERE status != 'Open';
END
$$ LANGUAGE plpgsql;


SELECT * FROM intel.device_issues_metrics()
