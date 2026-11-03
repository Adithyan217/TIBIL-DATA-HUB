-- DROP TABLE IF EXISTS switch.payments_cache;
-- DROP TABLE IF EXISTS switch.dtypes CASCADE;
-- DROP TABLE IF EXISTS switch.devices CASCADE;
-- DROP TABLE IF EXISTS switch.ins CASCADE;
-- DROP TABLE IF EXISTS switch.sb_router;
-- DROP TABLE IF EXISTS switch.router CASCADE;
-- DROP TYPE IF EXISTS environment_type;
-- DROP FUNCTION IF EXISTS switch.insert_and_fetch_durl(integer, integer, jsonb) CASCADE;
-- DROP SCHEMA IF EXISTS switch;

CREATE SCHEMA IF NOT EXISTS switch;

CREATE TABLE IF NOT EXISTS switch.payments_cache (
  pid SERIAL PRIMARY KEY,
  iid INTEGER NOT NULL,
  did INTEGER NOT NULL,
  details JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() 
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
    did INTEGER UNIQUE NOT NULL,
    tid INTEGER NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tid FOREIGN KEY (tid) REFERENCES switch.dtypes(pid)
);

CREATE INDEX IF NOT EXISTS tid_idx ON switch.dtypes(pid);

CREATE TABLE switch.ins (
    pid SERIAL PRIMARY KEY,
    iid INTEGER,
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

CREATE OR REPLACE FUNCTION switch.insert_and_fetch_durl(
    _iid INT,
    _did INT,
    _details JSONB
) RETURNS TABLE(
    iid INT,
    did INT,
    durl VARCHAR,
	details JSON
) AS $$
BEGIN
    -- Insert the record into the payments_cache table
    INSERT INTO switch.payments_cache (iid, did, details)
    VALUES (_iid, _did, _details)
    RETURNING switch.payments_cache.iid, switch.payments_cache.did, switch.payments_cache.details INTO iid, did, details;

    -- Fetch the durl from the mrouter materialized view
    RETURN QUERY
    SELECT switch.mrouter.iid, switch.mrouter.did, switch.mrouter.durl, details
    FROM switch.mrouter
    WHERE switch.mrouter.iid = _iid AND switch.mrouter.did = _did
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;