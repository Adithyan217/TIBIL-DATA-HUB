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

INSERT INTO registry.merchant_types(
	merchant_type)
	VALUES ('Type 1'),('Type 2'),('Type 3');

INSERT INTO registry.sim_providers(
	sim_provider)
	VALUES ('Airtel'),('Jio'),('BSNL');


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
    bankname VARCHAR,
    branchname VARCHAR,
    merchantname VARCHAR,
    merchantinfo JSON,
	status registry.dr_status,
    eventid INTEGER,
    simprovider VARCHAR,
    devicequantity INTEGER,
    merchanttype VARCHAR,
    eventby VARCHAR
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






--------------------------------------------------------------------------
ALTER TABLE registry.upermissions ADD COLUMN fname VARCHAR;
ALTER TABLE registry.upermissions ADD COLUMN lname VARCHAR;
ALTER TABLE registry.upermissions ADD COLUMN urole VARCHAR;
ALTER TABLE registry.upermissions ADD COLUMN isd BOOLEAN DEFAULT false;

ALTER TABLE registry.upermissions
ADD CONSTRAINT upermissions_unique_user_context
UNIQUE (username, context, context_id);

CREATE INDEX IF NOT EXISTS idx_upermissions_username_contex_context_id
ON registry.upermissions(username,context,context_id);

DROP FUNCTION IF EXISTS registry.add_user_permissions;


CREATE OR REPLACE FUNCTION registry.add_user_permissions(
    p_username TEXT,
    p_allow_banks TEXT[],
    p_deny_banks TEXT[],
    p_allow_branches TEXT[],
    p_deny_branches TEXT[],
    f_name TEXT,
    l_name TEXT,
	u_role TEXT
)
RETURNS TABLE(
    r_username VARCHAR, 
    r_context registry.ucontexts, 
    r_context_id INT, 
    r_fname VARCHAR, 
    r_lname VARCHAR,
    r_action TEXT  -- 'ALLOW' or 'DENY'
) AS $$
DECLARE
    bank_id INT;
    branch_id INT;
BEGIN
    -- Handle allowed banks
    FOR i IN 1..COALESCE(array_length(p_allow_banks, 1), 0) LOOP
        SELECT bid INTO bank_id FROM registry.banks WHERE bname = p_allow_banks[i];

        IF bank_id IS NOT NULL THEN
			RETURN QUERY
				INSERT INTO registry.upermissions AS u (username, context, context_id, fname, lname,urole)
                VALUES (p_username, 'BANK', bank_id, f_name, l_name,u_role)
				ON CONFLICT(username, context, context_id) 
				DO UPDATE SET isd = FALSE
                RETURNING u.username, u.context, u.context_id, u.fname, u.lname, 'ALLOW'::TEXT;
        ELSE
            RAISE NOTICE 'Bank "%" not found.', p_allow_banks[i];
        END IF;
    END LOOP;

    -- Handle denied banks
    FOR i IN 1..COALESCE(array_length(p_deny_banks, 1), 0) LOOP
        SELECT bid INTO bank_id FROM registry.banks WHERE bname = p_deny_banks[i];

        IF bank_id IS NOT NULL THEN
            RETURN QUERY
            UPDATE registry.upermissions AS u
            SET isd = true
            WHERE u.username = p_username AND u.context_id = bank_id AND u.context = 'BANK'
            RETURNING u.username, u.context, u.context_id, u.fname, u.lname, 'DENY'::TEXT;
        ELSE
            RAISE NOTICE 'Bank "%" not found.', p_deny_banks[i];
        END IF;
    END LOOP;

    -- Handle allowed branches
    FOR i IN 1..COALESCE(array_length(p_allow_branches, 1), 0) LOOP
        SELECT brid INTO branch_id FROM registry.branches WHERE brname = p_allow_branches[i];

        IF branch_id IS NOT NULL THEN
			RETURN QUERY
			INSERT INTO registry.upermissions AS u (username, context, context_id, fname, lname,urole)
            VALUES (p_username, 'BRANCH', branch_id, f_name, l_name,u_role)
			ON CONFLICT(username, context, context_id) 
			DO UPDATE SET isd = FALSE
            RETURNING u.username, u.context, u.context_id, u.fname, u.lname, 'ALLOW'::TEXT;
        ELSE
            RAISE NOTICE 'Branch "%" not found.', p_allow_branches[i];
        END IF;
    END LOOP;

    -- Handle denied branches
    FOR i IN 1..COALESCE(array_length(p_deny_branches, 1), 0) LOOP
        SELECT brid INTO branch_id FROM registry.branches WHERE brname = p_deny_branches[i];

        IF branch_id IS NOT NULL THEN
            RETURN QUERY
            UPDATE registry.upermissions AS u
            SET isd = true
            WHERE u.username = p_username AND u.context_id = branch_id AND u.context = 'BRANCH'
            RETURNING u.username, u.context, u.context_id, u.fname, u.lname, 'DENY'::TEXT;
        ELSE
            RAISE NOTICE 'Branch "%" not found.', p_deny_branches[i];
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;




-------------------Manufacture Language
CREATE TABLE IF NOT EXISTS registry.mf_language ( 
	lid SERIAL PRIMARY KEY,
	lname VARCHAR NOT NULL,
	dlid VARCHAR NOT NULL,
	mfid INTEGER NOT NULL  REFERENCES registry.mf (mfid),
	isd BOOLEAN DEFAULT false
);




------------------------MERCHANT CHANGES------------------------------------------

DROP FUNCTION IF EXISTS registry.merchant_validator;

DROP FUNCTION IF EXISTS registry.merchant_validator_writer;

DROP FUNCTION IF EXISTS registry.merchant_iterator;


ALTER TYPE registry.merchants_msgs ADD VALUE IF NOT EXISTS 'INVALID_MERCHANT_TYPE';




CREATE OR REPLACE FUNCTION registry.merchant_validator(mp_id INTEGER,m_name VARCHAR,br_id INTEGER,b_id INTEGER,m_info JSONB,m_addr VARCHAR,m_type VARCHAR) 
RETURNS registry.merchants_msgs[] AS $$
DECLARE
messages registry.merchants_msgs[];
BEGIN
	CASE
		WHEN mp_id IS NULL THEN
   			IF EXISTS (SELECT 1 FROM registry.merchants WHERE mname = m_name ) THEN
        		messages := array_append(messages, 'MERCHANT_REPEATED'::registry.merchants_msgs);
    		END IF;

			IF NOT EXISTS (SELECT 1 FROM registry.branches WHERE brid = br_id AND isd = 'false') THEN
    			messages := array_append(messages, 'INVALID_BRANCH'::registry.merchants_msgs);
			END IF;
	
			IF NOT EXISTS (SELECT 1 FROM registry.banks WHERE bid = b_id AND isd = 'false') THEN
    			messages := array_append(messages, 'INVALID_BANK'::registry.merchants_msgs);
			END IF;
	
			IF NOT EXISTS (SELECT 1 FROM registry.merchant_types WHERE merchant_type = m_type AND isd = 'false') THEN
    			messages := array_append(messages, 'INVALID_MERCHANT_TYPE'::registry.merchants_msgs);
			END IF;
			
		WHEN mp_id IS NOT NULL THEN
			IF NOT EXISTS (SELECT 1 FROM registry.merchants WHERE mpid = mp_id AND isd = 'false') THEN
        		messages := array_append(messages, 'INVALID_MERCHANT'::registry.merchants_msgs);
    		END IF;

			IF m_info = '{}' and m_addr is NULL THEN
        		messages := array_append(messages, 'EMPTY_UPDATE'::registry.merchants_msgs);
    		END IF;			
		
	END CASE;
    RETURN messages;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.merchant_validator_writer(
    rowid INTEGER,
	mp_id INTEGER,
    m_name VARCHAR,
	m_addr VARCHAR,
	b_name VARCHAR,
	br_name VARCHAR,
	m_info JSONB,
	ms_id INTEGER,
    e_by VARCHAR,
    e_id INTEGER,
	m_type VARCHAR
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.merchants_msgs[],mp_ids VARCHAR) AS $$
DECLARE
    m_evt registry.mevts := 'MERCHANT_ONBOARDED';
	merchant_name VARCHAR := null;
	validator_result registry.merchants_msgs[];
    b_id INTEGER := NULL;
    br_id INTEGER := NULL;
	mt_id INTEGER := NULL;
	
BEGIN

    SELECT bid INTO b_id FROM registry.banks WHERE bname = b_name;
    SELECT brid INTO br_id FROM registry.branches WHERE brname = br_name;
	SELECT mtid INTO mt_id FROM registry.merchant_types WHERE merchant_type = m_type;

	validator_result := registry.merchant_validator(mp_id,m_name,br_id,b_id,m_info,m_addr,m_type);
	   
    IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,merchant_name;
		RETURN;
	END IF;

	CASE 
		WHEN mp_id IS NULL THEN
    		INSERT INTO registry.merchants (eid, mevt, eby, mname,bid,brid,minfo,msid,maddr,mtid)
    		VALUES (e_id, m_evt, e_by, m_name,b_id,br_id,m_info,ms_id,m_addr,mt_id)
			RETURNING mname INTO merchant_name;
			RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_INSERT']::registry.merchants_msgs[],merchant_name;
		WHEN mp_id IS NOT NULL THEN
    		UPDATE registry.merchants
       		SET 
            	minfo = COALESCE(NULLIF(m_info::text, '{}'::text)::json, minfo),
				maddr = COALESCE(m_addr,maddr),
				eby = e_by,
				eid = e_id,
				eat = CURRENT_TIMESTAMP
       		WHERE mpid = mp_id
            RETURNING mname INTO merchant_name;
       		RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_UPDATE']::registry.merchants_msgs[], merchant_name;

	END CASE;
			

END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.merchant_iterator(
	rowid INT[],
	mp_id INT[],
    m_name TEXT[],
	m_addr TEXT[],
	b_name TEXT[],
	br_name TEXT[],
	minfo JSONB[],
	msid INT[],
    event_bys VARCHAR[],
    eids INT[],
	m_type TEXT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.merchants_msgs[],mpid VARCHAR) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(rowid, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.merchant_validator_writer(
			rowid[i],
			mp_id[i],
    		m_name[i],
			COALESCE(NULLIF(m_addr[i],''),NULL),
			b_name[i],
			br_name[i],
			COALESCE(minfo[i],'{}'),
			msid[i],
    		event_bys[i],   
            eids[i],
			m_type[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;






---------------------------------------SIM REQUEST----------------------------------

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
    requested_sim TEXT,
	bankname TEXT,
	branchname TEXT
) AS $$
DECLARE
    simrequest_id INTEGER;
    devices_name VARCHAR;
    merchants_name VARCHAR;
    issue_status registry.sr_status;
    event_id INTEGER;
    curr_sp TEXT;
    req_sp TEXT;
	bank_name TEXT;
	branch_name TEXT;
BEGIN
    IF context = 'CREATE' THEN
        INSERT INTO registry.sim_request AS sr (
            dname, bname, bid, brname, mname, status, eby, eid, current_sp, requested_sp
        )
        VALUES (
            d_name, b_name, b_id, br_name, m_name, sr_status, e_by, e_id, c_sp, r_sp
        )
        RETURNING sr.srid, sr.dname, sr.mname, sr.status, sr.eid, sr.current_sp, sr.requested_sp,sr.bname,sr.brname
        INTO simrequest_id, devices_name, merchants_name, issue_status, event_id, curr_sp, req_sp,bank_name,branch_name;

        RETURN QUERY SELECT rowid, 'REQUEST_CREATED', simrequest_id, devices_name, merchants_name, issue_status, event_id, curr_sp, req_sp,bank_name,branch_name;

    ELSIF context = 'UPDATE' THEN
        IF EXISTS (SELECT 1 FROM registry.sim_request AS sr WHERE sr.srid = sim_request_id) THEN
            UPDATE registry.sim_request AS sr
            SET
                status = sr_status,
                eby = e_by,
                eid = e_id
            WHERE sr.srid = sim_request_id
            RETURNING sr.dname, sr.mname, sr.status, sr.eid, sr.current_sp, sr.requested_sp,sr.bname,sr.brname
            INTO devices_name, merchants_name, issue_status, event_id, curr_sp, req_sp,bank_name,branch_name;

            RETURN QUERY SELECT rowid, 'REQUEST_UPDATED', sim_request_id, devices_name, merchants_name, issue_status, event_id, curr_sp, req_sp,bank_name,branch_name;
        ELSE
            RETURN QUERY SELECT rowid, 'INVALID_SRID', sim_request_id, NULL, NULL, NULL, NULL, NULL, NULL,NULL,NULL;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;





---------------------------STATUS TABLE

INSERT INTO registry.status (context, status, priority)
VALUES 
  ('sim_request', 'Dispatched', 1),
  ('sim_request', 'Delivered', 2);



----------------------------------UPDATE_DEVICE

ALTER TABLE registry.devices 
ADD COLUMN lid INTEGER REFERENCES registry.mf_language(lid);

DROP FUNCTION IF EXISTS registry.update_device;

CREATE OR REPLACE FUNCTION registry.update_device(
    rowid INTEGER,
    d_id INTEGER,
    f_name VARCHAR,
    lang VARCHAR,
    sb_e BOOLEAN,
    e_by VARCHAR,
    e_id INTEGER
)
RETURNS TABLE (
    row_id INTEGER,
    status INTEGER,
    msg registry.devices_msgs[],
    d_names VARCHAR
) AS $$
DECLARE
    device_name VARCHAR;
    f_id INTEGER;
    validator_result registry.devices_msgs[];
	l_id INTEGER;
BEGIN
    validator_result := registry.update_device_validator(f_name,sb_e,lang,d_id);

    IF array_length(validator_result, 1) > 0 THEN
        RETURN QUERY SELECT rowid, 0, validator_result, NULL::VARCHAR;
        RETURN;
    END IF;

	IF f_name IS NOT NULL THEN
        SELECT fid INTO f_id
        FROM registry.firmware
        WHERE fname = f_name;
    END IF;

	IF lang IS NOT NULL THEN
        SELECT lid INTO l_id
        FROM registry.mf_language
        WHERE dlid = lang;
    END IF;
	

    UPDATE registry.devices
    SET 
        fid  = COALESCE(f_id, fid),
        sbe  = COALESCE(sb_e, sbe),
        lid   = COALESCE(l_id, lid),
        eby  = e_by,
        eid  = e_id,
        eat  = CURRENT_TIMESTAMP
    WHERE did = d_id
    RETURNING dname INTO device_name;

    RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_UPDATE']::registry.devices_msgs[], device_name;
END;
$$ LANGUAGE plpgsql;

ALTER TYPE registry.devices_msgs ADD VALUE IF NOT EXISTS 'INVALID_LANGUAGE';

DROP FUNCTION IF EXISTS registry.update_device_validator;


CREATE OR REPLACE FUNCTION registry.update_device_validator(
f_name VARCHAR,
sb_e BOOLEAN,
lang VARCHAR,
d_id INTEGER
)
RETURNS registry.devices_msgs[] AS $$
DECLARE
messages registry.devices_msgs[];
BEGIN
    IF NOT EXISTS (SELECT 1 FROM registry.devices WHERE did = d_id and isd = false and isa = true) THEN
        messages := array_append(messages, 'INVALID_DEVICE'::registry.devices_msgs);
    END IF;

    IF f_name IS NULL AND sb_e IS NULL AND lang IS NULL THEN
        messages := array_append(messages, 'EMPTY_UPDATE'::registry.devices_msgs);
        RETURN messages;
    END IF;

    IF f_name IS NOT NULL AND NOT EXISTS (SELECT 1 FROM registry.firmware WHERE fname = f_name) THEN
        messages := array_append(messages, 'INVALID_FIRMWARE'::registry.devices_msgs);
    END IF;

	IF lang IS NOT NULL AND NOT EXISTS (SELECT 1 FROM registry.mf_language WHERE dlid = lang) THEN
        messages := array_append(messages, 'INVALID_LANGUAGE'::registry.devices_msgs);
    END IF;

    RETURN messages;
END;
$$ LANGUAGE plpgsql;

