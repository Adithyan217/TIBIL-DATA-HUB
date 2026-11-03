-- DROP TABLE IF EXISTS drouter.payments_cache;
-- DROP TABLE IF EXISTS drouter.dtypes CASCADE;
-- DROP TABLE IF EXISTS drouter.devices CASCADE;
-- DROP TABLE IF EXISTS drouter.ins CASCADE;
-- DROP TABLE IF EXISTS drouter.sb_router;
-- DROP TABLE IF EXISTS drouter.router CASCADE;
-- DROP TYPE IF EXISTS environment_type;
-- DROP FUNCTION IF EXISTS drouter.insert_and_fetch_durl(integer, integer, jsonb) CASCADE;
-- DROP SCHEMA IF EXISTS drouter;

CREATE SCHEMA IF NOT EXISTS drouter;

CREATE TYPE drouter.pcstatus AS ENUM  (  'RECEIVED', 'TRANSFORMED', 'TRANSFORM_FAILED', 'SENT_REQUEST_TO_drouter',
    'SUCCESS_RESPONSE_FROM_drouter', 'FAILURE_RESPONSE_FROM_drouter')

CREATE TABLE IF NOT EXISTS drouter.payments_cache (
  pid SERIAL PRIMARY KEY,
  iid INTEGER NOT NULL,
  did INTEGER NOT NULL,
  amount DOUBLE,
  transaction_time BIGINT,
  status drouter.pcstatus NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


);



CREATE TABLE drouter.dtypes (
    pid SERIAL PRIMARY KEY,
    dtype VARCHAR NOT NULL,
    durl VARCHAR NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);



CREATE TABLE IF NOT EXISTS drouter.devices (
    pid SERIAL PRIMARY KEY,
    dname VARCHAR NOT NULL,
    did INTEGER UNIQUE NOT NULL,
    tid INTEGER NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tid FOREIGN KEY (tid) REFERENCES drouter.dtypes(pid)
);

CREATE INDEX IF NOT EXISTS tid_idx ON drouter.dtypes(pid);

CREATE TABLE drouter.ins (
    pid SERIAL PRIMARY KEY,
    iid INTEGER,
    iname VARCHAR NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE  environment_type AS ENUM ('DEV', 'UAT', 'PROD');
CREATE TABLE IF NOT EXISTS drouter.router (
    pid SERIAL PRIMARY KEY,
    iid INTEGER,
    did INTEGER,
    is_deleted BOOLEAN DEFAULT false,
    environment environment_type,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_iid FOREIGN KEY (iid) REFERENCES drouter.ins(pid),
    CONSTRAINT fk_did FOREIGN KEY (did) REFERENCES drouter.devices(pid)
	
);

CREATE INDEX IF NOT EXISTS did_idx ON drouter.router(did);
CREATE INDEX IF NOT EXISTS iid_idx ON drouter.router(iid);

CREATE MATERIALIZED VIEW IF NOT EXISTS drouter.mrouter AS
select i.iid,d.did, dt.durl
        from drouter.router as dr
        JOIN drouter.devices as d ON d.pid = dr.did
        JOIN drouter.dtypes as dt ON d.tid = dt.pid
        JOIN drouter.ins as i ON i.pid = dr.iid
        where dr.environment = 'DEV' AND i.is_deleted = false 
        AND dt.is_deleted = false AND d.is_deleted = false
		order by iid, did ASC;


CREATE INDEX IF NOT EXISTS iid_did_idx ON drouter.mrouter(iid,did);

CREATE OR REPLACE FUNCTION drouter.update_and_fetch_durl(
    _iid INT,
    _did INT,
    _status VARCHAR,
    _amount DOUBLE,
    _transaction_time BIGINT,
    _pid INT
) RETURNS TABLE(
    iid INT,
    did INT,
    durl VARCHAR
) AS $$
BEGIN
    -- Insert the record into the payments_cache table
    UPDATE drouter.payments_cache SET iid = _iid, did = _did, status = _status, amount = _amount, transaction_time= _transaction_time, updated_at= CURRENT_TIMESTAMP
   WHERE pid = _pid;

    -- Fetch the durl from the mrouter materialized view
    RETURN QUERY
    SELECT drouter.mrouter.iid, drouter.mrouter.did, drouter.mrouter.durl
    FROM drouter.mrouter
    WHERE drouter.mrouter.iid = _iid AND drouter.mrouter.did = _did
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS drouter.plog
(
    lid SERIAL PRIMARY KEY,	
    pid INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    lmsg drouter.pcstatus
);
