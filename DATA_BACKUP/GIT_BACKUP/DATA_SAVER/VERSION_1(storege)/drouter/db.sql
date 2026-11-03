DROP TABLE IF EXISTS switch.payments_cache;
DROP TABLE IF EXISTS switch.dtypes CASCADE;
DROP TABLE IF EXISTS switch.devices CASCADE;
DROP TABLE IF EXISTS switch.ins CASCADE;
DROP TABLE IF EXISTS switch.sb_router;
DROP TABLE IF EXISTS switch.router CASCADE;
DROP TYPE IF EXISTS environment_type;
DROP FUNCTION IF EXISTS switch.insert_and_fetch_durl(integer, integer, jsonb) CASCADE;
DROP SCHEMA IF EXISTS switch;

CREATE SCHEMA IF NOT EXISTS switch;

CREATE TYPE switch.pcstatus AS ENUM  (  'RECEIVED', 'TRANSFORMED', 'TRANSFORM_FAILED', 'SENT_REQUEST_TO_SWITCH',
    'SUCCESS_RESPONSE_FROM_SWITCH', 'FAILURE_RESPONSE_FROM_SWITCH')

CREATE TABLE IF NOT EXISTS switch.payments_cache (
  pid SERIAL PRIMARY KEY,
  iid VARCHAR NOT NULL,
  did VARCHAR NOT NULL,
  amount DOUBLE PRECISION,
  transaction_time BIGINT,
  status switch.pcstatus NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP


);



CREATE TABLE switch.dtypes (
    pid SERIAL PRIMARY KEY,
    dtype VARCHAR NOT NULL,
    durl VARCHAR NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);



CREATE TABLE IF NOT EXISTS switch.devices (
    pid SERIAL PRIMARY KEY,
    dname VARCHAR NOT NULL,
    did VARCHAR UNIQUE NOT NULL,
    tid INTEGER NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tid FOREIGN KEY (tid) REFERENCES switch.dtypes(pid)
);

CREATE INDEX IF NOT EXISTS tid_idx ON switch.dtypes(pid);

CREATE TABLE switch.ins (
    pid SERIAL PRIMARY KEY,
    iid VARCHAR,
    iname VARCHAR NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE  environment_type AS ENUM ('DEV', 'UAT', 'PROD');
CREATE TABLE IF NOT EXISTS switch.router (
    pid SERIAL PRIMARY KEY,
    iid INTEGER,
    did INTEGER,
    is_deleted BOOLEAN DEFAULT false,
    environment environment_type,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_iid FOREIGN KEY (iid) REFERENCES switch.ins(pid),
    CONSTRAINT fk_did FOREIGN KEY (did) REFERENCES switch.devices(pid)
	
);

CREATE INDEX IF NOT EXISTS did_idx ON switch.router(did);
CREATE INDEX IF NOT EXISTS iid_idx ON switch.router(iid);

CREATE MATERIALIZED VIEW IF NOT EXISTS switch.mrouter AS
select i.iid,d.did, dt.durl
        from switch.router as dr
        JOIN switch.devices as d ON d.pid = dr.did
        JOIN switch.dtypes as dt ON d.tid = dt.pid
        JOIN switch.ins as i ON i.pid = dr.iid
        where dr.environment = 'DEV' AND i.is_deleted = false 
        AND dt.is_deleted = false AND d.is_deleted = false
		order by iid, did ASC;


CREATE INDEX IF NOT EXISTS iid_did_idx ON switch.mrouter(iid,did);

CREATE OR REPLACE FUNCTION switch.update_and_fetch_durl(
    _iid INT,
    _did INT,
    _status VARCHAR,
    _amount DOUBLE PRECISION,
    _transaction_time BIGINT,
    _pid INT
) RETURNS TABLE(
    iid INT,
    did INT,
    durl VARCHAR,
	client VARCHAR
) AS $$
BEGIN
    -- Insert the record into the payments_cache table
    UPDATE switch.payments_cache SET iid = _iid, did = _did, status = _status, amount = _amount, transaction_time= _transaction_time, updated_at= CURRENT_TIMESTAMP
   WHERE pid = _pid;

    -- Fetch the durl from the mrouter materialized view
    RETURN QUERY
    SELECT switch.mrouter.iid, switch.mrouter.did, switch.mrouter.durl, switch.mrouter.client_name
    FROM switch.mrouter
    WHERE switch.mrouter.iid = _iid AND switch.mrouter.did = _did
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;


CREATE TABLE IF NOT EXISTS switch.clients (
    pid SERIAL PRIMARY KEY,
	client_name VARCHAR
);

ALTER TABLE switch.devices ADD column cid INTEGER 

ALTER TABLE switch.devices 
ADD constraint client_fkey
FOREIGN KEY (cid)
REFERENCES switch.clients (pid);
