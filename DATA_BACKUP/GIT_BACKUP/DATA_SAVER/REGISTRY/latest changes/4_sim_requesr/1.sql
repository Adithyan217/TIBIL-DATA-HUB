INSERT INTO workflow.wfactions (ecode, ainfo, htype, isvisible, category, vcode, ischainable) VALUES
('SIM_REQUEST_DELIVERED', '{"endpoint":"/requests/wfhandler"}', 'api', true, 'sim_actions', NULL, false),
('SIM_REQUEST_DISPATCHED', '{"endpoint":"/requests/wfhandler"}', 'api', true, 'sim_actions', NULL, false),
('SIM_REQUEST', '{"endpoint":"/requests/wfhandler"}', 'api', true, 'sim_actions', 'Sim Request', true);


INSERT INTO workflow.wfhsteps (ecode, hinfo) VALUES
('SIM_REQUEST', '[{"endpoint":"/registry/sim-requests","sname":"Sim Request","method":"post"}]'),
('SIM_REQUEST_DISPATCHED', '[{"endpoint":"/registry/sim-requests","sname":"Sim Request Dispatched","method":"post"}]'),
('SIM_REQUEST_DELIVERED', '[{"endpoint":"/registry/sim-requests","sname":"Sim Request Delivered","method":"post"}]');


INSERT INTO workflow.echain (pecode, eorder, cecode, final_status) VALUES
('SIM_REQUEST', 1, 'SIM_REQUEST_DISPATCHED', false),
('SIM_REQUEST', 1, 'SIM_REQUEST_DELIVERED', true);



CREATE TYPE registry.sr_status AS ENUM (
    'Open',
    'Dispatched',
    'Delivered'
);




CREATE TABLE registry.sim_request (
    srid SERIAL PRIMARY KEY,
    bname VARCHAR,
    bid INTEGER,
    dname VARCHAR,
    brname VARCHAR,
    mname VARCHAR,
    current_sp VARCHAR,
    requested_sp VARCHAR,
    status registry.sr_status DEFAULT 'Open',
    eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    eid INTEGER NOT NULL,
    eby VARCHAR NOT NULL
);



CREATE INDEX IF NOT EXISTS idx_sim_request_bname ON registry.sim_request(bname);
CREATE INDEX IF NOT EXISTS idx_sim_request_bid ON registry.sim_request(bid);
CREATE INDEX IF NOT EXISTS idx_sim_request_branch ON registry.sim_request(brname);
CREATE INDEX IF NOT EXISTS idx_sim_request_device ON registry.sim_request(dname);
CREATE INDEX IF NOT EXISTS idx_sim_request_merchant ON registry.sim_request(mname);
CREATE INDEX IF NOT EXISTS idx_sim_request_status ON registry.sim_request(status);


-----------------------------FUNCTION
DROP FUNCTION IF EXISTS registry.sim_request;

CREATE OR REPLACE FUNCTION registry.sim_request(
    rowid INTEGER,
    sim_request_id INTEGER,
    context VARCHAR,
    d_name VARCHAR,
    b_name VARCHAR,
    b_id INTEGER,
    br_name VARCHAR,
    m_name VARCHAR,
    sr_status registry.sr_status,
    e_by VARCHAR,
    e_id INTEGER,
    c_sp VARCHAR,
    r_sp VARCHAR
)
RETURNS TABLE (
    row_id INTEGER,
    msg TEXT,
    srid INTEGER,
    deviceId VARCHAR,
    merchantName VARCHAR,
    status registry.sr_status,
    eventID INTEGER,
    current_sim TEXT,
    requested_sim TEXT
) AS $$
DECLARE
    simrequest_id INTEGER;
    devices_name VARCHAR;
    merchants_name VARCHAR;
    issue_status registry.sr_status;
    event_id INTEGER;
    curr_sp TEXT;
    req_sp TEXT;
BEGIN
    IF context = 'CREATE' THEN
        INSERT INTO registry.sim_request AS sr (
            dname, bname, bid, brname, mname, status, eby, eid, current_sp, requested_sp
        )
        VALUES (
            d_name, b_name, b_id, br_name, m_name, sr_status, e_by, e_id, c_sp, r_sp
        )
        RETURNING sr.srid, sr.dname, sr.mname, sr.status, sr.eid, sr.current_sp, sr.requested_sp
        INTO simrequest_id, devices_name, merchants_name, issue_status, event_id, curr_sp, req_sp;

        RETURN QUERY SELECT rowid, 'REQUEST_CREATED', simrequest_id, devices_name, merchants_name, issue_status, event_id, curr_sp, req_sp;

    ELSIF context = 'UPDATE' THEN
        IF EXISTS (SELECT 1 FROM registry.sim_request AS sr WHERE sr.srid = sim_request_id) THEN
            UPDATE registry.sim_request AS sr
            SET
                status = sr_status,
                eby = e_by,
                eid = e_id
            WHERE sr.srid = sim_request_id
            RETURNING sr.dname, sr.mname, sr.status, sr.eid, sr.current_sp, sr.requested_sp
            INTO devices_name, merchants_name, issue_status, event_id, curr_sp, req_sp;

            RETURN QUERY SELECT rowid, 'REQUEST_UPDATED', sim_request_id, devices_name, merchants_name, issue_status, event_id, curr_sp, req_sp;
        ELSE
            RETURN QUERY SELECT rowid, 'INVALID_SRID', sim_request_id, NULL, NULL, NULL, NULL, NULL, NULL;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;


SELECT * FROM registry.sim_request(
    1,                -- rowid
    1,             -- sim_request_id (NULL when creating)
    'UPDATE',         -- context
    'Device X',       -- d_name
    'Bank A',         -- b_name
    101,              -- b_id
    'Branch Z',       -- br_name
    'Merchant Y',     -- m_name
    'Dispatched',           -- sr_status
    'admin_user',     -- e_by
    5001,             -- e_id
    'Airtel',         -- current_sp
    'Jio'             -- requested_sp
);

SELECT * FROM registry.sim_request