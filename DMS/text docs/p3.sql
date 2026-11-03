payment metrics
------------------PREPARATION SCRIPTS---------------------------------


DELETE FROM registry.sb_v WHERE did in (SELECT did FROM registry.devices WHERE dname LIKE 'tester%');
DELETE FROM registry.sb WHERE did in (SELECT did FROM registry.devices WHERE dname LIKE 'tester%');

DELETE FROM registry.vpa_v WHERE did in (SELECT did FROM registry.devices WHERE dname LIKE 'tester%');
DELETE FROM registry.vpa WHERE did in (SELECT did FROM registry.devices WHERE dname LIKE 'tester%');

DELETE FROM registry.vpa_v WHERE vpa LIKE 'tester%';
DELETE FROM registry.vpa WHERE vpa LIKE 'tester%';

DELETE FROM registry.devices_v WHERE dname LIKE 'tester%';
DELETE FROM registry.devices WHERE dname LIKE 'tester%';

DELETE FROM registry.branches_v WHERE brname LIKE 'tester%';
DELETE FROM registry.branches WHERE brname LIKE 'tester%';

DELETE FROM registry.banks_v WHERE bname LIKE 'tester%';
DELETE FROM registry.banks WHERE bname LIKE 'tester%';








SELECT *FROM registry.sb WHERE did in (SELECT did FROM registry.devices WHERE dname LIKE 'tester%') order by brid;

select brid,count(*) FROM registry.sb  WHERE did in (SELECT did FROM registry.devices WHERE dname LIKE 'tester%') group by brid order by brid

select * from registry.sb where brid = 90003 order by did


DROP FUNCTION IF EXISTS intel.test_payment_metrics2

CREATE OR REPLACE FUNCTION intel.test_payment_metrics(
    uname VARCHAR,
    bank_name VARCHAR,
    branch_name VARCHAR,
    range_type VARCHAR
)
RETURNS TABLE (mname TEXT, mvalue DOUBLE PRECISION) AS $$
BEGIN
    RETURN QUERY
    WITH filtered_data AS (
        SELECT p.txnamt
        FROM registry.plog p
        JOIN registry.devices d ON p.imei = d.imei
        JOIN registry.sb s ON d.did = s.did
        WHERE s.bid IN (
                  SELECT context_id 
                  FROM intel.upermissions  
                  WHERE username = uname AND context = 'BANK'
              )
          AND s.brid IN (
                  SELECT context_id 
                  FROM intel.upermissions  
                  WHERE username = uname AND context = 'BRANCH'
              )
          AND (bank_name IS NULL OR s.bid = (SELECT bid FROM registry.banks WHERE bname = bank_name))
          AND (branch_name IS NULL OR s.brid = (SELECT brid FROM registry.branches WHERE brname = branch_name))
          AND (
              range_type IS NULL OR
              (
                  (range_type = 'TODAY' AND p.cat::date = CURRENT_DATE)
                  OR (range_type = '7DAYS' AND p.cat::date >= CURRENT_DATE - INTERVAL '6 days')
                  OR (range_type = '30DAYS' AND p.cat::date >= CURRENT_DATE - INTERVAL '29 days')
              )
          )
    )
    SELECT 'total_txn', COUNT(*)::DOUBLE PRECISION FROM filtered_data
    UNION ALL
    SELECT 'total_amt', COALESCE(SUM(txnamt), 0) FROM filtered_data;
END
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION intel.test_payment_metrics(uname VARCHAR,bank_name VARCHAR,branch_name VARCHAR,range_type VARCHAR)
RETURNS TABLE (mname TEXT, mvalue DOUBLE PRECISION) AS $$
BEGIN
    RETURN QUERY
    SELECT 'total_txn' AS mname, COUNT(txnamt)::DOUBLE PRECISION AS mvalue
    FROM registry.plog p
	JOIN registry.devices d ON p.imei = d.imei
	JOIN registry.sb s ON d.did = s.did
	WHERE s.bid IN (SELECT context_id FROM intel.upermissions  WHERE username = uname AND context = 'BANK' )
	AND s.brid IN (SELECT context_id FROM intel.upermissions  WHERE username = uname AND context = 'BRANCH' )
	AND (bank_name IS NULL OR s.bid = (SELECT b.bid from registry.banks b WHERE b.bname=bank_name))
	AND (branch_name IS NULL OR s.brid = (SELECT br.brid FROM registry.branches br WHERE br.brname=branch_name))
    AND (
                range_type IS NULL OR
                (
                    (range_type = 'TODAY' AND p.cat::date = CURRENT_DATE)
                    OR
                    (range_type = '7DAYS' AND p.cat::date >= CURRENT_DATE - INTERVAL '6 days')
                    OR
                    (range_type = '30DAYS' AND p.cat::date >= CURRENT_DATE - INTERVAL '29 days')
                )
            )
	UNION ALL
    SELECT 'total_amt', COALESCE(SUM(txnamt), 0)
        FROM registry.plog p
	JOIN registry.devices d ON p.imei = d.imei
	JOIN registry.sb s ON d.did = s.did
	WHERE s.bid IN (SELECT context_id FROM intel.upermissions  WHERE username = uname AND context = 'BANK' )
	AND s.brid IN (SELECT context_id FROM intel.upermissions  WHERE username = uname AND context = 'BRANCH' )
	AND (bank_name IS NULL OR s.bid = (SELECT b.bid from registry.banks b WHERE b.bname=bank_name))
	AND (branch_name IS NULL OR s.brid = (SELECT br.brid FROM registry.branches br WHERE br.brname=branch_name))
	AND (
                range_type IS NULL OR
                (
                    (range_type = 'TODAY' AND p.cat::date = CURRENT_DATE)
                    OR
                    (range_type = '7DAYS' AND p.cat::date >= CURRENT_DATE - INTERVAL '6 days')
                    OR
                    (range_type = '30DAYS' AND p.cat::date >= CURRENT_DATE - INTERVAL '29 days')
                )
            );
END
$$ LANGUAGE plpgsql;

-- CREATE OR REPLACE FUNCTION intel.test_payment_metrics(uname VARCHAR, bank_name VARCHAR, branch_name VARCHAR)
-- RETURNS TABLE (mname TEXT, mvalue DOUBLE PRECISION) AS $$
-- BEGIN
--     RETURN QUERY
--     WITH user_bank AS (
--         SELECT context_id AS bid
--         FROM intel.upermissions
--         WHERE username = uname AND context = 'BANK'
--     ),
--     user_branch AS (
--         SELECT context_id AS brid
--         FROM intel.upermissions
--         WHERE username = uname AND context = 'BRANCH'
--     ),
--     target_ids AS (
--         SELECT b.bid, br.brid
--         FROM registry.banks b
--         JOIN registry.branches br ON br.bid = b.bid
--         WHERE b.bname = bank_name AND br.brname = branch_name
--     ),
--     filtered_logs AS (
--         SELECT p.txnamt
--         FROM registry.plog p
--         JOIN registry.devices d ON p.imei = d.imei
--         JOIN registry.sb s ON d.did = s.did
--         JOIN user_bank ub ON s.bid = ub.bid
--         JOIN user_branch ubr ON s.brid = ubr.brid
--         JOIN target_ids t ON s.bid = t.bid AND s.brid = t.brid
--     )
--     SELECT 'total_txn', COUNT(*)::DOUBLE PRECISION FROM filtered_logs
--     UNION ALL
--     SELECT 'total_amt', COALESCE(SUM(txnamt), 0) FROM filtered_logs;
-- END
-- $$ LANGUAGE plpgsql;

-- CREATE OR REPLACE FUNCTION intel.test_payment_metrics(
--     uname VARCHAR,
--     bank_name VARCHAR DEFAULT NULL,
--     branch_name VARCHAR DEFAULT NULL
-- )
-- RETURNS TABLE (mname TEXT, mvalue DOUBLE PRECISION) AS $$
-- BEGIN
--     RETURN QUERY
--     WITH user_bank AS (
--         SELECT context_id AS bid
--         FROM intel.upermissions
--         WHERE username = uname AND context = 'BANK'
--     ),
--     user_branch AS (
--         SELECT context_id AS brid
--         FROM intel.upermissions
--         WHERE username = uname AND context = 'BRANCH'
--     ),
--     filtered_sb AS (
--         SELECT s.bid, s.brid, p.txnamt
--         FROM registry.plog p
--         JOIN registry.devices d ON p.imei = d.imei
--         JOIN registry.sb s ON d.did = s.did
--         JOIN user_bank ub ON s.bid = ub.bid
--         JOIN user_branch ubr ON s.brid = ubr.brid
--         WHERE
--             (bank_name IS NULL OR s.bid = (
--                 SELECT bid FROM registry.banks b WHERE b.bname = bank_name
--             ))
--             AND
--             (branch_name IS NULL OR s.brid = (
--                 SELECT brid FROM registry.branches br WHERE br.brname = branch_name
--             ))
--     )
--     SELECT 'total_txn', COUNT(*)::DOUBLE PRECISION FROM filtered_sb
--     UNION ALL
--     SELECT 'total_amt', COALESCE(SUM(txnamt), 0) FROM filtered_sb;
-- END
-- $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.test_payment_metrics(
    uname VARCHAR,
    bank_name VARCHAR DEFAULT NULL,
    branch_name VARCHAR DEFAULT NULL,
    range_type VARCHAR DEFAULT NULL  -- 'TODAY', '7DAYS', '30DAYS'
)
RETURNS TABLE (mname TEXT, mvalue DOUBLE PRECISION) AS $$
BEGIN
    RETURN QUERY
    WITH user_bank AS (
        SELECT context_id AS bid
        FROM intel.upermissions
        WHERE username = uname AND context = 'BANK'
    ),
    user_branch AS (
        SELECT context_id AS brid
        FROM intel.upermissions
        WHERE username = uname AND context = 'BRANCH'
    ),
    filtered_sb AS (
        SELECT s.bid, s.brid, p.txnamt, p.cat
        FROM registry.plog p
        JOIN registry.devices d ON p.imei = d.imei
        JOIN registry.sb s ON d.did = s.did
        JOIN user_bank ub ON s.bid = ub.bid
        JOIN user_branch ubr ON s.brid = ubr.brid
        WHERE
            (bank_name IS NULL OR s.bid = (
                SELECT bid FROM registry.banks WHERE bname = bank_name
            ))
            AND
            (branch_name IS NULL OR s.brid = (
                SELECT brid FROM registry.branches WHERE brname = branch_name
            ))
            AND (
                range_type IS NULL OR
                (
                    (range_type = 'TODAY' AND p.cat::date = CURRENT_DATE)
                    OR
                    (range_type = '7DAYS' AND p.cat::date >= CURRENT_DATE - INTERVAL '6 days')
                    OR
                    (range_type = '30DAYS' AND p.cat::date >= CURRENT_DATE - INTERVAL '29 days')
                )
            )
    )
    SELECT 'total_txn', COUNT(*)::DOUBLE PRECISION FROM filtered_sb
    UNION ALL
    SELECT 'total_amt', COALESCE(SUM(txnamt), 0) FROM filtered_sb;
END
$$ LANGUAGE plpgsql;


adminuser@gmail.com

EXPLAIN ANALYZE
SELECT * FROM intel.test_payment_metrics('tester@gmail.com',null,null,'30DAYS')

SELECT * FROM intel.upermissions WHERE username = 'vinuta.hegde@tibilsolutions.com' order by (context,context_id)

SELECT * FROM registry.devices where dname like 'tester%'
ORDER BY did ASC 

SELECT * FROM registry.routes
ORDER BY rid ASC 

SELECT * FROM registry.sb s where s.did IN (SELECT did FROM registry.devices where dname like 'tester%'
)
ORDER BY sid ASC 

SELECT * FROM registry.upermissions
ORDER BY upid ASC 

SELECT * FROM registry.plog   where imei like 'tester_imei%'
ORDER BY plid desc 

TRUNCATE registry.plog

WITH limited_rows AS (
    SELECT ctid  -- ctid is a unique row identifier in PostgreSQL
    FROM registry.plog
    LIMIT 50000
)
UPDATE registry.plog
SET cat = '2025-04-29 10:00:00'
WHERE 
-- ctid IN (SELECT ctid FROM limited_rows)
-- AND 
imei = 'tester_imei6';


UPDATE registry.plog
SET imei = 'tester_imei'
WHERE imei ='1231';

SELECT DISTINCT(imei) FROM registry.plog

select bid from registry.banks where bname = 'Jana Bank'

select brid from registry.branches where brname = 'ALLAHABAD-BRANCH'


select brname from registry.branches b WHERE b.brid IN
(select s.brid from registry.sb s WHERE s.did IN
(SELECT d.did FROM registry.devices d WHERE d.imei IN (SELECT p.imei FROM registry.plog p ))  )

select b.bid,s.brid,bname,dname,p.imei from registry.devices d 
JOIN registry.sb s ON d.did = s.did
JOIN registry.banks b ON s.bid = b.bid
JOIN registry.plog p ON p.imei = d.imei
ORDER by bname
