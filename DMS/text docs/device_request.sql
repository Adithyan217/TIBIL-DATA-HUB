CREATE TABLE registry.merchant_types(
	mtid SERIAL PRIMARY KEY,
	merchant_type VARCHAR,
	isd BOOLEAN DEFAULT false,
	cat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_merchant_type
ON registry.merchant_types(merchant_type);

CREATE TABLE registry.sim_providers(
    spid SERIAL PRIMARY KEY,
    sim_provider VARCHAR,
    spinfo JSONB,
    cat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	isd BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_sim_provider
ON registry.sim_providers(sim_provider);



ALTER TABLE registry.merchants
ADD COLUMN mtid INTEGER;

ALTER TABLE registry.merchants
ADD CONSTRAINT merchant_types
FOREIGN KEY (mtid)
REFERENCES registry.merchant_types(mtid);




DROP TABLE IF EXISTS registry.device_requests;

CREATE TABLE registry.device_requests (
	drid SERIAL PRIMARY KEY,
	bname VARCHAR,
	bid INTEGER,
	brname VARCHAR ,
	mname VARCHAR ,
	minfo JSON ,
	status registry.dr_status DEFAULT 'Open',
	merchant_type VARCHAR,
	sim_provider VARCHAR,
	device_quantity INTEGER,
	eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	eby VARCHAR NOT NULL,
	eid INTEGER NOT NULL
);


CREATE INDEX IF NOT EXISTS idx_device_requests_bid
ON registry.device_requests(bid);
CREATE INDEX IF NOT EXISTS idx_device_requests_bname
ON registry.device_requests(bname);

CREATE INDEX IF NOT EXISTS idx_device_requests_brname
ON registry.device_requests(brname);

CREATE INDEX IF NOT EXISTS idx_device_requests_mname
ON registry.device_requests(mname);

CREATE INDEX IF NOT EXISTS idx_device_requests_status
ON registry.device_requests(status);

CREATE INDEX IF NOT EXISTS idx_device_requests_sim_provider
ON registry.device_requests(sim_provider);
CREATE INDEX IF NOT EXISTS idx_device_requests_merchant_type
ON registry.device_requests(merchant_type);


DROP FUNCTION IF EXISTS registry.request_for_device;

DROP FUNCTION IF EXISTS registry.device_request_validator_writer;

CREATE OR REPLACE FUNCTION registry.device_request_validator_writer(
    rowid INTEGER,
    device_request_id INTEGER,
    context VARCHAR,
    b_name VARCHAR,
    b_id INTEGER,
    br_name VARCHAR,
    m_name VARCHAR,
    dr_status registry.dr_status,
    s_provider VARCHAR,
    d_quantity INTEGER,
    e_by VARCHAR,
    e_id INTEGER
)
RETURNS TABLE (
    row_id INTEGER,
    msg TEXT,
    dr_id INTEGER,
    bankName VARCHAR,
    branchName VARCHAR,
    merchantName VARCHAR,
    merchantInfo JSON,
    status registry.dr_status,
    eventID INTEGER,
    simProvider VARCHAR,
    deviceQuantity INTEGER,
    merchantType VARCHAR,
    eventBY VARCHAR
) AS $$
DECLARE
    devicerequest_id INTEGER;
    banks_name VARCHAR;
    branches_name VARCHAR;
    merchants_name VARCHAR;
    merchant_info JSON;
    request_status registry.dr_status;
    event_id INTEGER;
    event_by VARCHAR;
    simprovider VARCHAR;
    devicequantity INTEGER;
    merchanttype VARCHAR;
BEGIN
    -- Fetch merchant info and type

    -- Handle CREATE context
    IF context = 'CREATE' THEN

		SELECT minfo INTO merchant_info FROM registry.merchants WHERE mname = m_name;
    	SELECT merchant_type INTO merchanttype FROM registry.merchant_types WHERE mtid = (SELECT mtid FROM registry.merchants WHERE mname = m_name);

        -- Insert new device request and return values
        INSERT INTO registry.device_requests AS dr(bname, brname, mname, minfo, status, eby, eid, bid, sim_provider, device_quantity, merchant_type)
        VALUES (b_name, br_name, m_name, merchant_info, dr_status, e_by, e_id, b_id, s_provider, d_quantity, merchanttype)
        RETURNING drid, bname, brname, mname, minfo, dr.status, eid, eby, sim_provider, device_quantity, merchant_type
        INTO devicerequest_id, banks_name, branches_name, merchants_name, merchant_info, request_status, event_id, event_by, simprovider, devicequantity, merchanttype;

        -- Return the result as a query
        RETURN QUERY SELECT rowid, 'REQUEST_CREATED', devicerequest_id, banks_name, branches_name, merchants_name, merchant_info, request_status, event_id, simprovider, devicequantity, merchanttype, event_by;

    -- Handle UPDATE context
    ELSIF context = 'UPDATE' THEN
        IF EXISTS(SELECT 1 FROM registry.device_requests AS dr WHERE dr.drid = device_request_id) THEN
            -- Update existing device request and return values
            UPDATE registry.device_requests AS dr
            SET status = dr_status, eby = e_by, eid = e_id
            WHERE dr.drid = device_request_id
            RETURNING bname, brname, mname, minfo, dr.status, eid, eby, sim_provider, device_quantity, merchant_type
            INTO banks_name, branches_name, merchants_name, merchant_info, request_status, event_id, event_by, simprovider, devicequantity, merchanttype;

            -- Return the updated result as a query
            RETURN QUERY SELECT rowid, 'REQUEST_UPDATED', device_request_id, banks_name, branches_name, merchants_name, merchant_info, request_status, event_id, simprovider, devicequantity, merchanttype, event_by;
        ELSE
            -- Return error if device request ID doesn't exist
            RETURN QUERY SELECT rowid, 'INVALID_DRID', device_request_id, banks_name, branches_name, merchants_name, merchant_info, request_status, event_id, simprovider, devicequantity, merchanttype, event_by;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS registry.device_request_iterator;


CREATE OR REPLACE FUNCTION registry.device_request_iterator(
	rowid INT[],
	drid INT[],
	context TEXT[],
    b_name TEXT[],
	b_id INT[],
	br_name TEXT[] ,
	m_name TEXT[],
    s_provider TEXT[],
    d_quantity INT[],
	dr_status TEXT[],
	event_bys TEXT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER,
    msg TEXT,
    dr_id INTEGER,
    bank_name VARCHAR,
    branch_name VARCHAR,
    merchant_name VARCHAR,
    merchant_info JSON,
	status registry.dr_status,
    event_id INTEGER,
    sim_provider VARCHAR,
    device_quantity INTEGER,
    merchant_type VARCHAR,
    event_by VARCHAR
)  AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(rowid, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.device_request_validator_writer(
			rowid[i],
			drid [i],
			context[i],
			b_name[i],
			b_id[i],
			br_name[i],
			m_name[i],
			dr_status[i]::registry.dr_status,
			s_provider[i] ,
   			d_quantity[i],
    		event_bys[i],   
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;






SELECT * FROM registry.device_request_validator_writer(
    1,                      -- rowid (example)
    71,                   -- device_request_id (example)
    'UPDATE',               -- context ('CREATE' or 'UPDATE')
    'Bank Name',            -- b_name (example bank name)
    5678,                   -- b_id (example bank ID)
    'Branch Name',          -- br_name (example branch name)
    'merchant_1',        -- m_name (example merchant name)
    'Allocated',               -- dr_status (example status, e.g., 'ACTIVE')
    'Provider Name',        -- s_provider (example SIM provider name)
    100,                    -- d_quantity (example device quantity)
    'Event By',             -- e_by (example event by name)
    9876                    -- e_id (example event ID)
);



SELECT * FROM registry.device_request_iterator(
    ARRAY[1, 2],                                -- rowid (Array of Integers)
    ARRAY[101, 101],                            -- drid (Array of Integers)
    ARRAY['CREATE', 'UPDATE'],                  -- context (Array of Text)        -- m_name (Array of Text)
    ARRAY['Bank A', 'Bank B'], 
	ARRAY[1,2],
	ARRAY['merchant_1', 'merchant_2'],  
	  -- b_name (Array of Text)
    ARRAY['Branch X', 'Branch Y'],              -- br_name (Array of Text)
    ARRAY['Provider X', 'Provider Y'],          -- s_provider (Array of Text)
    ARRAY[10, 20],                              -- d_quantity (Array of Integers)
    ARRAY['Open', 'Open'], -- dr_status (Array of Enum registry.dr_status)
    ARRAY['Alice', 'Bob'],                      -- event_bys (Array of Text)
    ARRAY[1001, 1002]                           -- eids (Array of Integers)
);