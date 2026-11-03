CREATE TABLE IF NOT EXISTS registry.temp_recon_csv (
    merchant_name VARCHAR,
    mobile_no VARCHAR,
    device_serial_number VARCHAR,
    acc_no VARCHAR
);

CREATE OR REPLACE VIEW registry.temp_recon_db AS 
SELECT m.mname AS merchant_name, 
m.minfo ->> 'phno' AS mobile_no, 
d.dname AS device_serial_number, 
m.minfo ->> 'accNo' AS acc_no 
FROM registry.merchants m 
LEFT JOIN registry.sb s ON s.mid = m.mpid 
LEFT JOIN registry.devices d ON s.did = d.did;


-- Execution Time: 4.104 ms (1000 rows)
CREATE OR REPLACE FUNCTION registry.device_recon()
RETURNS TABLE (
    merchant_name VARCHAR,
    csv_mobile_no VARCHAR,
    db_mobile_no VARCHAR,
    csv_device_serial VARCHAR,
    db_device_serial VARCHAR,
    csv_acc_no VARCHAR,
    db_acc_no VARCHAR,
    issue VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- 1. Missing merchants in DB
    RETURN QUERY
    SELECT 
        c.merchant_name::VARCHAR,
        c.mobile_no::VARCHAR,
        NULL::VARCHAR,
        c.device_serial_number::VARCHAR,
        NULL::VARCHAR,
        c.acc_no::VARCHAR,
        NULL::VARCHAR,
        'missing_in_db'::VARCHAR
    FROM registry.temp_recon_csv c
    LEFT JOIN registry.temp_recon_db d 
        ON c.merchant_name = d.merchant_name
    WHERE d.merchant_name IS NULL;

    -- 2. Missing merchants in CSV
    RETURN QUERY
    SELECT 
        d.merchant_name::VARCHAR,
        NULL::VARCHAR,
        d.mobile_no::VARCHAR,
        NULL::VARCHAR,
        d.device_serial_number::VARCHAR,
        NULL::VARCHAR,
        d.acc_no::VARCHAR,
        'missing_in_csv'::VARCHAR
    FROM registry.temp_recon_db d
    LEFT JOIN registry.temp_recon_csv c 
        ON c.merchant_name = d.merchant_name
    WHERE c.merchant_name IS NULL;

    -- 3+4. Device missing in DB + field mismatches combined
    RETURN QUERY
    SELECT 
        c.merchant_name::VARCHAR,
        c.mobile_no::VARCHAR,
        d.mobile_no::VARCHAR,
        c.device_serial_number::VARCHAR,
        d.device_serial_number::VARCHAR,
        c.acc_no::VARCHAR,
        d.acc_no::VARCHAR,
        TRIM(BOTH ',' FROM
            CONCAT(
                CASE WHEN NOT EXISTS (
                    SELECT 1 
                    FROM registry.temp_recon_db d2 
                    WHERE d2.merchant_name = c.merchant_name
                      AND d2.device_serial_number = c.device_serial_number
                ) THEN 'device_serial_mismatch,' ELSE '' END,
                CASE WHEN c.mobile_no IS DISTINCT FROM d.mobile_no THEN 'mobile_no_mismatch,' ELSE '' END,
                CASE WHEN c.acc_no IS DISTINCT FROM d.acc_no THEN 'acc_no_mismatch,' ELSE '' END
            )
        )::VARCHAR AS issue
    FROM registry.temp_recon_csv c
    JOIN registry.temp_recon_db d 
        ON c.merchant_name = d.merchant_name
    WHERE (NOT EXISTS (
                SELECT 1 
                FROM registry.temp_recon_db d2 
                WHERE d2.merchant_name = c.merchant_name
                  AND d2.device_serial_number = c.device_serial_number
           )
           OR c.mobile_no IS DISTINCT FROM d.mobile_no
           OR c.acc_no IS DISTINCT FROM d.acc_no);

END;
$$;
