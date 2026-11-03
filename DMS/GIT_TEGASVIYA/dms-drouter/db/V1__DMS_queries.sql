CREATE SCHEMA IF NOT EXISTS drouter;

CREATE TABLE IF NOT EXISTS drouter.soundboxes(
did SERIAL PRIMARY KEY,
dname VARCHAR UNIQUE NOT NULL,
imei VARCHAR UNIQUE NOT NULL,
cat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dname ON drouter.soundboxes(dname); 
CREATE INDEX IF NOT EXISTS idx_imei ON drouter.soundboxes(imei); 


CREATE TABLE IF NOT EXISTS drouter.deactivated_list (
    dlid SERIAL PRIMARY KEY,
    dname VARCHAR UNIQUE NOT NULL,
    cat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_did ON drouter.deactivated_list(dname);

CREATE TYPE drouter.pcstatus AS ENUM
('RECEIVED', 'TRANSFORMED', 'TRANSFORM_FAILED', 'SENT_REQUEST_TO_SWITCH', 'SUCCESS_RESPONSE_FROM_SWITCH', 'FAILURE_RESPONSE_FROM_SWITCH', 'SENT_REQUEST_TO_MQTT', 'SUCCESS_RESPONSE_FROM_MQTT', 'FAILURE_RESPONSE_FROM_MQTT', 'RECEIVED_AND_FAILED', 'DECRYPTED', 'ENCRYPTED', 'DECRYPTION_FAILED', 'ENCRYPTION_FAILED', 'TRANSFORMATION_FAILED', 'DEACTIVATED_DEVICE');

CREATE TABLE IF NOT EXISTS drouter.payments_cache (
    pid SERIAL PRIMARY KEY,
    iid VARCHAR NOT NULL,
    dname VARCHAR NOT NULL,
    details VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    key VARCHAR,
    amount DOUBLE PRECISION,
    status drouter.pcstatus,
    rrn VARCHAR
);

CREATE INDEX IF NOT EXISTS idx_iid ON drouter.payments_cache(iid);

CREATE OR REPLACE FUNCTION drouter.validate_and_insert_into_payments_cache(
    _iid VARCHAR, 
    _dname_param VARCHAR, 
    _key VARCHAR,
    _details VARCHAR,
    _status drouter.pcstatus
) 
RETURNS TABLE(imei VARCHAR, dname VARCHAR, rcontext VARCHAR, is_deactivated BOOLEAN, inserted_pid INTEGER ) AS $$
DECLARE
    _pid INTEGER;
    pstatus drouter.pcstatus;
    _imei VARCHAR;
    _dname VARCHAR;
	_rcontext VARCHAR;
BEGIN
    -- Retrieve device details from `soundboxes` and check if it is in `deactivated_list`
    SELECT 
        sb.imei, 
        sb.dname, 
		sb.rcontext,
        EXISTS (SELECT 1 FROM drouter.deactivated_list dl WHERE dl.dname = sb.dname) AS is_deactivated
    INTO _imei, _dname, _rcontext, is_deactivated
    FROM drouter.soundboxes sb
    WHERE sb.dname = _dname_param;

    -- If no match is found in `soundboxes`, raise an exception
  IF _dname IS NULL THEN
        RETURN QUERY SELECT NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, NULL::BOOLEAN, NULL::INTEGER;
        RETURN;
    END IF;

    -- Set status based on deactivation status
    IF is_deactivated THEN 
        pstatus = 'DEACTIVATED_DEVICE';
    ELSE
        pstatus = _status;
    END IF;
    
    -- Insert into payments_cache table
    INSERT INTO drouter.payments_cache (iid, key, dname, details, status)
    VALUES (_iid, _key, _dname, _details, pstatus)
    RETURNING pid INTO _pid;

    -- Return the details
    RETURN QUERY SELECT _imei, _dname,  _rcontext, is_deactivated, _pid;
END;
$$ LANGUAGE plpgsql;


ALTER TABLE drouter.deactivated_list ADD COLUMN ISD BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_dname_imei ON drouter.soundboxes(dname,imei); 

ALTER TABLE drouter.soundboxes ADD column rcontext VARCHAR 
