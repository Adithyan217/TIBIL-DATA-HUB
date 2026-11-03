CREATE SCHEMA IF NOT EXISTS workflow;

CREATE TYPE workflow.hlists AS ENUM
    ('dag', 'api');


CREATE TYPE workflow.hlogstatus as ENUM ('PROCESSED', 'PROCESSING', 'FAILURE');

CREATE TYPE workflow.alogstatus as ENUM ('PROCESSED', 'PROCESSING', 'FAILURE');


CREATE TABLE IF NOT EXISTS workflow.wfevtslog (
    eid SERIAL PRIMARY KEY,
    eby VARCHAR,
    einfo JSON,
    ecode VARCHAR, -- Reference to the enum created earlier
    estatus VARCHAR CHECK (estatus IN ('NEW', 'READ')),
    eat TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    isd BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS workflow.wfactions (
    aid SERIAL PRIMARY KEY,
    ecode VARCHAR,
    ainfo JSON,
    htype workflow.hlists,
    category VARCHAR,
    isvisible BOOLEAN DEFAULT TRUE,
    isd BOOLEAN DEFAULT false,
    vcode VARCHAR
);

-- Recreate the wfhandlers table
CREATE TABLE IF NOT EXISTS workflow.wfhsteps (
    sid SERIAL PRIMARY KEY,
    ecode VARCHAR,
    hinfo JSON,
    isd BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS workflow.wfalog (
    lid SERIAL PRIMARY KEY,
    aid INTEGER NOT NULL,
    eid INTEGER NOT NULL,
    runid VARCHAR,
    astatus workflow.alogstatus,
    wfstart TIMESTAMP NOT NULL,
    wfend TIMESTAMP,
    FOREIGN KEY (eid) REFERENCES workflow.wfevtslog (eid),
    FOREIGN KEY (aid) REFERENCES workflow.wfactions (aid)
);

CREATE TABLE IF NOT EXISTS workflow.wfhlog (
    lid SERIAL PRIMARY KEY,          -- Log ID
    sid INTEGER NOT NULL,            -- Foreign key from wfhandlers
    aid INTEGER NOT NULL,            -- Foreign key from wfactions
    eid INTEGER NOT NULL,            -- Foreign key from wfevents
    hstatus workflow.hlogstatus,  -- Check constraint on status
    wfstart TIMESTAMP NOT NULL,      -- Workflow start time
    wfend TIMESTAMP,                 -- Workflow end time (optional)
    hdetails JSON,                   -- Handler details in JSON
    FOREIGN KEY (eid) REFERENCES workflow.wfevtslog (eid),   -- FK to wfevents
    FOREIGN KEY (aid) REFERENCES workflow.wfactions (aid),  -- FK to wfactions
    FOREIGN KEY (sid) REFERENCES workflow.wfhsteps (sid)  -- FK to wfhandlers
);


