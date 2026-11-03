CREATE TABLE IF NOT EXISTS registry.dtypes(
dtid SERIAL PRIMARY KEY,
dtname VARCHAR(25),
description VARCHAR(500),
isd bool
);

INSERT INTO registry.dtypes(dtname,description) VALUES 
('MSB', 'Mobile Soundbox'),
('SB', 'Soundbox')

ALTER TABLE registry.devices
ADD COLUMN dtid INTEGER REFERENCES registry.dtypes(dtid);




--------------MSB ENUM--------------------

CREATE TYPE registry.msb_devices_msgs AS ENUM (
		'SUCCESS_INSERT',
		'DEVICE_REPEATED',
		'INVALID_BANK',
		'INVALID_BRANCH',
		'INVALID_MERCHANT',
		'NO_SB_DEVICE_FOUND'
);


-----------------------MSB FUNCTIONS----------------------

DROP FUNCTION IF EXISTS registry.msb_device_validator,registry.msb_device_validator_writer,registry.msb_device_iterator;

CREATE OR REPLACE FUNCTION registry.msb_device_validator(d_name VARCHAR,b_id INTEGER,br_id INTEGER,mp_id INTEGER) 
RETURNS registry.msb_devices_msgs[] AS $$
DECLARE
    messages registry.msb_devices_msgs[] := ARRAY[]::registry.msb_devices_msgs[];
BEGIN
   			IF EXISTS (SELECT 1 FROM registry.devices WHERE dname = d_name ) THEN
       		 messages := array_append(messages, 'DEVICE_REPEATED'::registry.msb_devices_msgs);
    		END IF;	

			IF NOT EXISTS (SELECT 1 FROM registry.banks WHERE bid = b_id AND isd = FALSE AND isa = True) THEN
                messages := array_append(messages, 'INVALID_BANK'::registry.msb_devices_msgs);
            END IF;

			IF NOT EXISTS (SELECT 1 FROM registry.branches WHERE brid = br_id AND isd = FALSE AND isa = True) THEN
                messages := array_append(messages, 'INVALID_BRANCH'::registry.msb_devices_msgs);
            END IF;

            IF NOT EXISTS (SELECT 1 FROM registry.merchants WHERE mpid = mp_id AND isd = FALSE AND isa = True) THEN
                messages := array_append(messages, 'INVALID_MERCHANT'::registry.msb_devices_msgs);
            END IF;

			IF NOT EXISTS (SELECT 1 FROM registry.sb WHERE mid = mp_id AND isd = FALSE AND isa = True) THEN
			     messages := array_append(messages, 'NO_SB_DEVICE_FOUND'::registry.msb_devices_msgs);
            END IF;

    RETURN messages;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.msb_device_validator_writer(
    rowid INTEGER,
    d_name VARCHAR,
    b_name VARCHAR ,
    br_name VARCHAR,
	m_name VARCHAR,
    e_by VARCHAR,
    e_id INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.msb_devices_msgs[],d_names VARCHAR) AS $$
DECLARE
    devt registry.devts := 'DEVICE_ONBOARDED';
	device_name VARCHAR := null;
	validator_result registry.msb_devices_msgs[];
	d_id INTEGER;
	b_id INTEGER;
    br_id INTEGER;
    mp_id INTEGER;
	dt_id INTEGER;
BEGIN
    SELECT bid INTO b_id FROM registry.banks WHERE bname = b_name ;
    SELECT brid INTO br_id FROM registry.branches WHERE brname = br_name ;
    SELECT mpid INTO mp_id FROM registry.merchants WHERE mname = m_name ;
	SELECT dtid INTO dt_id FROM registry.dtypes WHERE dtname = 'MSB';

	validator_result := registry.msb_device_validator(d_name,b_id,br_id,mp_id);
	
	IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,device_name;
		RETURN;
	END IF;
	
    INSERT INTO registry.devices (eid, devt, eby, dname, mfid, mdid, fid,imei,dtid)
		    VALUES (e_id, devt, e_by, d_name, null, null, null,d_name,dt_id)
			RETURNING dname,did INTO device_name,d_id;

	UPDATE registry.sb
            SET 
                sbevt = 'ALLOCATED_TO_BANK',
                bid = b_id,
                eby = e_by,
				eid = e_id,
                eat = CURRENT_TIMESTAMP
            WHERE did = d_id AND isd = FALSE;
			
	UPDATE registry.sb
            SET 
                sbevt = 'ALLOCATED_TO_BRANCH',
                brid = br_id,
                eby = e_by,
				eid = e_id,
                eat = CURRENT_TIMESTAMP
            WHERE did = d_id AND isd = FALSE;

			
    UPDATE registry.sb
            SET 
                sbevt = 'ALLOCATED_TO_MERCHANT',
                mid = mp_id,
                eby = e_by,
				eid = e_id,
                eat = CURRENT_TIMESTAMP
            WHERE did = d_id AND isd = FALSE;

	RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_INSERT']::registry.msb_devices_msgs[],device_name;

	
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.msb_device_iterator(
	rowid INT[],
    dnames TEXT[],
	bnames TEXT[],
	brnames TEXT[],
	mnames TEXT[],
    event_bys TEXT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.msb_devices_msgs[], did VARCHAR) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(rowid, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.msb_device_validator_writer(
			rowid[i],
    		dnames[i],
			bnames[i] ,
   			brnames[i],
			mnames[i],
    		event_bys[i],   
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;

-------------------CALLABLE QUERY--------------------------
-- SELECT * FROM registry.msb_device_iterator(
--     ARRAY[1, 2],                          -- rowid
--     ARRAY['86060696209', '86060696210'],       -- dnames
--     ARRAY['bank_1', 'bank_1'],           -- bnames
--     ARRAY['branch_1', 'branch_1'],       -- brnames
--     ARRAY['merchant_1', 'merchant_2'],   -- mnames
--     ARRAY['admin', 'admin'],             -- event_bys
--     ARRAY[1001, 1002]                    -- eids
-- );







-------------------------------MSB AGGREGATOR---------------------

CREATE OR REPLACE FUNCTION registry.onboard_msb_device(
    rowid INT[],
    d_names TEXT[],
    b_name TEXT[],
    br_name TEXT[],
    m_name TEXT[],
    event_bys TEXT[],
    eids INT[]
) 
RETURNS TABLE (
    row_id INTEGER, 
    status INTEGER, 
    event_response VARCHAR,
    steps TEXT[],
    step_status INTEGER[],
    update_device_response TEXT[],
    onboard_device_response TEXT[],
    onboard_vpa_response TEXT[],
    bind_device_response TEXT[],
    allocate_to_bank_response TEXT[],
    allocate_to_branch_response TEXT[],
    allocate_to_merchant_response TEXT[]
) AS
$$
DECLARE
    steps_arr TEXT[] := ARRAY['ONBOARD_DEVICE','ALLOCATE_TO_BANK','ALLOCATE_TO_BRANCH','ALLOCATE_TO_MERCHANT'];
    r RECORD;
BEGIN
    FOR r IN
        SELECT * FROM registry.msb_device_iterator(
            rowid,
            d_names,
            b_name,
            br_name,
            m_name,
            event_bys,
            eids
        )
    LOOP
        row_id := r.row_id;
        steps := steps_arr;

        IF r.status = 1 THEN
            status := 1;
            event_response := r.did;
            step_status := ARRAY[1,1,1,1];
            update_device_response := ARRAY[]::TEXT[];
            onboard_device_response := r.msg::TEXT[];
            onboard_vpa_response := ARRAY[]::TEXT[];
            bind_device_response := ARRAY[]::TEXT[];
            allocate_to_bank_response := ARRAY['SUCCESS'];
            allocate_to_branch_response := ARRAY['SUCCESS'];
            allocate_to_merchant_response := ARRAY['SUCCESS'];
        ELSE
            status := 0;
            event_response := NULL;
            step_status := ARRAY[0,0,0,0];
            update_device_response := ARRAY[]::TEXT[];
            onboard_device_response := r.msg::TEXT[];
            onboard_vpa_response := ARRAY[]::TEXT[];
            bind_device_response := ARRAY[]::TEXT[];
            allocate_to_bank_response := ARRAY['FAILED'];
            allocate_to_branch_response := ARRAY['FAILED'];
            allocate_to_merchant_response := ARRAY['FAILED'];
        END IF;

        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;


-- SELECT * FROM registry.onboard_msb_device(
--     ARRAY[1, 2],                          -- rowid
--     ARRAY['12060696209', '96060696210'],       -- dnames
--     ARRAY['bank_1', 'bank_1'],           -- bnames
--     ARRAY['branch_1', 'branch_1'],       -- brnames
--     ARRAY['merchant_1', 'merchant_2'],   -- mnames
--     ARRAY['admin', 'admin'],             -- event_bys
--     ARRAY[1001, 1002]                    -- eids
-- );


-----------------------------ONBOARD DEVICE CHANGE

CREATE OR REPLACE FUNCTION registry.device_validator_writer(
    rowid INTEGER,
	d_id INTEGER,
	mf_name VARCHAR,
    d_name VARCHAR,
    md_name VARCHAR ,
    f_name VARCHAR,
	imei_ VARCHAR,
	sb_e BOOLEAN,
    e_by VARCHAR,
    e_id INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.devices_msgs[],d_names VARCHAR) AS $$
DECLARE
    devt registry.devts := 'DEVICE_ONBOARDED';
	device_name VARCHAR := null;
	validator_result registry.devices_msgs[];
	mf_id INTEGER := null;
    md_id INTEGER := null;
    f_id INTEGER := null;
	dt_id INTEGER := null;
BEGIN

    SELECT mfid INTO mf_id FROM registry.mf WHERE mfname = mf_name;
    SELECT mdid INTO md_id FROM registry.model WHERE mdname = md_name;
    SELECT fid INTO f_id FROM registry.firmware WHERE fname = f_name;
	SELECT dtid INTO dt_id FROM registry.dtypes WHERE dtname = 'SB';

	validator_result := registry.device_validator(d_id,d_name,mf_id,md_id,f_id,imei_,sb_e);
	
	IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,device_name;
		RETURN;
	END IF;
	
	CASE
		WHEN d_id IS NULL THEN
    		INSERT INTO registry.devices (eid, devt, eby, dname, mfid, mdid, fid,imei,dtid)
    		VALUES (e_id, devt, e_by, d_name, mf_id, md_id, f_id,imei_,dt_id)
			RETURNING dname INTO device_name;
        	RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_INSERT']::registry.devices_msgs[],device_name;
		WHEN d_id IS NOT NULL THEN
    		UPDATE registry.devices
       		SET 
			    fid = COALESCE(f_id,fid),
				sbe = COALESCE(sb_e,sbe),
				eby = e_by,
				eid = e_id,
				eat = CURRENT_TIMESTAMP
       		WHERE did = d_id
            RETURNING dname INTO device_name;
       		RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_UPDATE']::registry.devices_msgs[], device_name;
	END CASE;		
END;
$$ LANGUAGE plpgsql;

-- SELECT * FROM registry.device_validator_writer(
--     rowid      := 1,
--     d_id       := NULL,                       -- NULL for new insert, or provide an existing device ID for update
--     mf_name    := 'mf_1',
--     d_name     := 'Galaxy A32',
--     md_name    := 'model_1',
--     f_name     := 'firmware_1',
--     imei_      := '123456789012345',
--     sb_e       := TRUE,
--     e_by       := 'admin_user',
--     e_id       := 501
-- );




