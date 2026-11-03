-- For main tables
ALTER TABLE registry.banks ALTER COLUMN eby TYPE VARCHAR(20);
ALTER TABLE registry.branches ALTER COLUMN eby TYPE VARCHAR(20);
ALTER TABLE registry.mf ALTER COLUMN eby TYPE VARCHAR(20);
ALTER TABLE registry.vpa ALTER COLUMN eby TYPE VARCHAR(20);
ALTER TABLE registry.merchants ALTER COLUMN eby TYPE VARCHAR(20);
ALTER TABLE registry.devices ALTER COLUMN eby TYPE VARCHAR(20);
ALTER TABLE registry.sb ALTER COLUMN eby TYPE VARCHAR(20);
ALTER TABLE registry.firmware ALTER COLUMN eby TYPE VARCHAR(20);
ALTER TABLE registry.model ALTER COLUMN eby TYPE VARCHAR(20);


-- For `_v` tables
ALTER TABLE registry.banks_v ALTER COLUMN eby TYPE VARCHAR(20);
ALTER TABLE registry.branches_v ALTER COLUMN eby TYPE VARCHAR(20);
ALTER TABLE registry.mf_v ALTER COLUMN eby TYPE VARCHAR(20);
ALTER TABLE registry.vpa_v ALTER COLUMN eby TYPE VARCHAR(20);
ALTER TABLE registry.merchants_v ALTER COLUMN eby TYPE VARCHAR(20);
ALTER TABLE registry.devices_v ALTER COLUMN eby TYPE VARCHAR(20);
ALTER TABLE registry.sb_v ALTER COLUMN eby TYPE VARCHAR(20);
ALTER TABLE registry.firmware_v ALTER COLUMN eby TYPE VARCHAR(20);
ALTER TABLE registry.model_v ALTER COLUMN eby TYPE VARCHAR(20);






--------------------------------------------------------------------------------------------------------------------------------
----------------------------------------------------BANKS_ONBOARD----------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------------------


CREATE TYPE registry.banks_msgs AS ENUM (
		'SUCCESS_INSERT',
		'SUCCESS_UPDATE',
		'BANK_REPEATED',
		'INVALID_BANK',
		'EMPTY_UPDATE'
);
		


CREATE OR REPLACE FUNCTION registry.bank_validator(b_name VARCHAR,b_id INTEGER,b_addr VARCHAR,b_info JSONB) 
RETURNS registry.banks_msgs[] AS $$
DECLARE
messages registry.banks_msgs[];
BEGIN
	CASE
		WHEN b_id IS NULL THEN
    		IF EXISTS (SELECT 1 FROM registry.banks WHERE bname = b_name) THEN
                messages := array_append(messages, 'BANK_REPEATED'::registry.banks_msgs);
			END IF;
		WHEN b_id IS NOT NULL THEN 
			IF b_addr IS NULL AND b_info = '{}' THEN
                messages := array_append(messages, 'EMPTY_UPDATE'::registry.banks_msgs);
			END IF;
			IF NOT EXISTS (SELECT 1 FROM registry.banks WHERE bid = b_id and isd = FALSE) THEN
                messages := array_append(messages, 'INVALID_BANK'::registry.banks_msgs);
			END IF;			
	END CASE;
	RETURN messages;
END;
$$ LANGUAGE plpgsql;




CREATE OR REPLACE FUNCTION registry.bank_validator_writer(
    rowid INTEGER,
	b_id INTEGER,	
    b_name VARCHAR,
    b_addr VARCHAR,
    b_info jsonb,
    e_by VARCHAR,
    e_id INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.banks_msgs[],bank_ids INTEGER) AS $$
DECLARE
    bank_id INTEGER := NULL;
    bevt registry.bevts := 'BANK_ONBOARDED';
	validator_result registry.banks_msgs[];
BEGIN
	validator_result :=  registry.bank_validator(b_name,b_id,b_addr,b_info);
	   
    IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,bank_id;
		RETURN;
	END IF;

	CASE 
		WHEN b_id IS NULL THEN
    		INSERT INTO registry.banks (bname, baddr, bevt, binfo, eby, eid)
    		VALUES (b_name, b_addr, bevt, b_info, e_by, e_id)
   			RETURNING bid INTO bank_id ;
   			RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_INSERT']::registry.banks_msgs[],bank_id;
				
		WHEN b_id IS NOT NULL THEN 
    		UPDATE registry.banks
       		SET 
           		baddr = COALESCE(b_addr, baddr),
            	binfo = COALESCE(NULLIF(b_info::text, '{}'::text)::json, binfo),
				eby = e_by,
				eid = e_id,
				eat = CURRENT_TIMESTAMP
       		WHERE bid = b_id;
       		RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_UPDATE']::registry.banks_msgs[], b_id;

	END CASE;


END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.bank_iterator(
	rowid INT[],
	bank_id INT[],
    bank_names TEXT[],
    bank_addrs TEXT[],
    binfo_list JSONB[],
    event_bys TEXT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.banks_msgs[],bid INTEGER) AS $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(rowid, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.bank_validator_writer(
			rowid[i],
			COALESCE(bank_id[i], NULL) ,
            bank_names[i],
            COALESCE(NULLIF(bank_addrs[i], ''), NULL),
            COALESCE(binfo_list[i],'{}'::jsonb), 
            event_bys[i], 
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;


EXPLAIN ANALYZE
SELECT row_id,status,msg,bid FROM registry.bank_iterator(
	ARRAY[1],
	ARRAY[]::integer[],
    ARRAY['bank122qq']::TEXT[], 
    ARRAY['MAin']::TEXT[], 
    ARRAY[        '{"name": "aaa", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}'
]::jsonb[], 
    ARRAY['1'], 
    ARRAY[1]::integer[]
);


SELECT row_id,status,msg,bank_ids FROM registry.bank_validator_writer(
	1,11,null,null,'{}',1,null
)


--------------------------------------------------------------------------------------------------------------------------------
----------------------------------------------------ONBOARD_MF----------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------------------

CREATE TYPE registry.mf_msgs AS ENUM (
		'SUCCESS_INSERT',
		'SUCCESS_UPDATE',
		'MF_REPEATED'
		'INVALID_MF',
		'EMPTY_UPDATE'
);

CREATE OR REPLACE FUNCTION registry.mf_validator(mf_id INTEGER,mf_name VARCHAR,mf_addr VARCHAR,mf_info JSONB) 
RETURNS registry.mf_msgs[] AS $$
DECLARE
messages registry.mf_msgs[];
BEGIN
	CASE
		WHEN mf_id IS NULL THEN
    		IF EXISTS (SELECT 1 FROM registry.mf WHERE mfname = mf_name ) THEN
                messages := array_append(messages, 'MF_REPEATED'::registry.mf_msgs);
            END IF; 
		WHEN mf_id IS NOT NULL THEN 
			IF mf_addr is null AND mf_info = '{}' THEN
                messages := array_append(messages, 'EMPTY_UPDATE'::registry.mf_msgs);
			END IF;
			IF NOT EXISTS (SELECT 1 FROM registry.mf WHERE mfid = mf_id and isd = FALSE) THEN
                messages := array_append(messages, 'INVALID_MF'::registry.mf_msgs);
			END IF;			
	END CASE;
	RETURN messages;
END;
$$ LANGUAGE plpgsql;




CREATE OR REPLACE FUNCTION registry.mf_validator_writer(
    rowid INTEGER,
    mf_id INTEGER,
    mf_name VARCHAR,
    mf_addr VARCHAR,
    mf_info jsonb,
    e_by VARCHAR,
    e_id INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.mf_msgs[],mf_ids INTEGER) AS $$
DECLARE
    mf_evt registry.mfevts := 'MF_ONBOARDED';
	mf_ids INTEGER := NULL;
    validator_result registry.mf_msgs[];

BEGIN

	validator_result :=  registry.mf_validator(mf_id,mf_name,mf_addr,mf_info);
    IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,mf_ids;
		RETURN;
	END IF;


    CASE 
		WHEN mf_id IS NULL THEN
    		INSERT INTO registry.mf (mfname, mfaddr, mfevt, mfinfo, eby, eid)
    	    VALUES (mf_name, mf_addr, mf_evt, mf_info, e_by, e_id)
		    RETURNING mfid INTO mf_ids;
   			RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_INSERT']::registry.mf_msgs[],mf_ids;
				
		WHEN mf_id IS NOT NULL THEN 
    		UPDATE registry.mf
       		SET 
           		mfaddr = COALESCE(mf_addr, mfaddr),
            	mfinfo = COALESCE(NULLIF(mf_info::text, '{}'::text)::json, mfinfo),
				eby = e_by,
				eat = CURRENT_TIMESTAMP
       		WHERE mfid = mf_id;
       		RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_UPDATE']::registry.mf_msgs[], mf_id;

	END CASE;

END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.mf_iterator(
	rowid INT[],
    mf_ids INTEGER[],
    mf_names TEXT[],
    mf_addrs TEXT[],
    mfinfo_list JSONB[],
    event_bys TEXT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.mf_msgs[],mfid INTEGER) AS $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(rowid, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.mf_validator_writer(
			rowid[i],
            COALESCE(mf_ids[i], NULL) ,
            COALESCE(mf_names[i],NULL),
            COALESCE(NULLIF(mf_addrs[i],''),NULL), 
            COALESCE(mfinfo_list[i],'{}'::jsonb), 
            COALESCE(event_bys[i],NULL), 
            COALESCE(eids[i],NULL)
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;

SELECT * FROM registry.mf_iterator(
	ARRAY[1,2],
    ARRAY[]::VARCHAR[], 
    ARRAY[]::VARCHAR[] , 
    ARRAY[]::jsonb[], 
    ARRAY[1, 1], 
    ARRAY[2, 2]
);

-----------------------------------------------ONBOARD_BRANCH-----------------------------------

CREATE TYPE registry.branches_msgs AS ENUM (
		'SUCCESS_INSERT',
		'BRANCH_REPEATED',
		'INVALID_BRANCH',
		'INVALID_BANK',
		'SUCCESS_UPDATE',
		'EMPTY_UPDATE'
);



CREATE OR REPLACE FUNCTION registry.branch_validator(br_name VARCHAR,b_id INTEGER,br_id INTEGER,br_addr VARCHAR,br_info jsonb) 
RETURNS registry.branches_msgs[] AS $$
DECLARE messages registry.branches_msgs[];
BEGIN
	CASE
		WHEN br_id IS NULL THEN
   			IF EXISTS (SELECT 1 FROM registry.branches WHERE brname = br_name ) THEN
           		 messages := array_append(messages, 'BRANCH_REPEATED'::registry.branches_msgs);
  		  	END IF;
	
			IF NOT EXISTS (SELECT 1 FROM registry.banks WHERE bid = b_id AND isd = 'false') THEN
		            messages := array_append(messages, 'INVALID_BANK'::registry.branches_msgs);
			END IF;
		WHEN br_id IS NOT NULL THEN 

			IF br_addr IS NULL AND br_info = '{}' THEN
           		 messages := array_append(messages, 'EMPTY_UPDATE'::registry.branches_msgs);
  		  	END IF;			
   			IF NOT EXISTS (SELECT 1 FROM registry.branches WHERE brid = br_id ) THEN
           		 messages := array_append(messages, 'INVALID_BRANCH'::registry.branches_msgs);
  		  	END IF;		
	END CASE;
    RETURN messages;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.branch_validator_writer(
    rowid INTEGER,
	br_id INTEGER,
	b_id INTEGER,
    br_name VARCHAR,
    br_addr VARCHAR,
    br_info jsonb,
    e_by VARCHAR,
    e_id INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.branches_msgs[],br_ids INTEGER) AS $$
DECLARE
    br_evt registry.brevts := 'BRANCH_ONBOARDED';
    branch_id INTEGER := NULL;
	validator_result registry.branches_msgs[];
BEGIN
	validator_result := registry.branch_validator(br_name,b_id,br_id,br_addr,br_info);

    IF array_length(validator_result, 1) > 0 THEN
	    RETURN QUERY SELECT rowid,0,validator_result,branch_id;
	    RETURN;
	END IF;
	CASE
		WHEN br_id IS NULL THEN
   			INSERT INTO registry.branches (brname,bid, braddr, brevt, brinfo, eby, eid)
    		VALUES (br_name,b_id, br_addr, br_evt, br_info, e_by, e_id)
   		 	RETURNING brid INTO branch_id;
   		 	RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_INSERT']::registry.branches_msgs[],branch_id;
				
		WHEN br_id IS NOT NULL THEN
    		UPDATE registry.branches
       		SET 
           		braddr = COALESCE(br_addr,braddr),
            	brinfo = COALESCE(NULLIF(br_info::text, '{}'::text)::json, brinfo),
				eby = e_by,
				eid = e_id,
				eat = CURRENT_TIMESTAMP
       		WHERE brid = br_id;
       		RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_UPDATE']::registry.branches_msgs[], br_id;

	END CASE;    

END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.branch_iterator(
	rowid INT[],
	br_id INT[],
	bank_id INT[],
    br_names TEXT[],
    br_addrs TEXT[],
    brinfo_list JSONB[],
    event_bys TEXT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.branches_msgs[],brid INTEGER) AS $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(rowid, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.branch_validator_writer(
			rowid[i],
			COALESCE(br_id[i],NULL),
			bank_id[i],
            br_names[i], 
            COALESCE(NULLIF(br_addrs[i],''),NULL),
            COALESCE(brinfo_list[i],'{}'::jsonb), 
            event_bys[i], 
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;


SELECT * FROM registry.branch_iterator(
	ARRAY[1,2],
	ARRAY[]::integer[],
	ARRAY[5,5]::integer[],
    ARRAY['qqq','qws']::text[], 
    ARRAY['1st Main Road', '2nd Main Road'], 
    ARRAY[
        '{"name": "sbi", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}',
        '{"name": "aaa", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}'
    ]::jsonb[], 
    ARRAY[1, 1], 
    ARRAY[2, 2]
);



-------------------------------------------ONBOARD_DEVICES------------------------------------------------------------
CREATE TYPE registry.devices_msgs AS ENUM (
		'SUCCESS_INSERT',
		'SUCCESS_UPDATE',
		'DEVICE_REPEATED',
		'INVALID_DEVICE',
		'INVALID_MF',
		'INVALID_FIRMWARE',
		'INVALID_MODEL',
		'EMPTY_UPDATE'
);



CREATE OR REPLACE FUNCTION registry.device_validator(d_id INTEGER,d_name VARCHAR,mf_id INTEGER,md_id INTEGER,f_id INTEGER ) 
RETURNS registry.devices_msgs[] AS $$
DECLARE
messages registry.devices_msgs[];
BEGIN
	IF NOT EXISTS (SELECT 1 FROM registry.firmware WHERE fid = f_id AND isd = 'false') THEN
    	messages := array_append(messages, 'INVALID_FIRMWARE'::registry.devices_msgs);
	END IF;

	CASE
		WHEN d_id IS NULL THEN
   			IF EXISTS (SELECT 1 FROM registry.devices WHERE dname = d_name ) THEN
       		 messages := array_append(messages, 'DEVICE_REPEATED'::registry.devices_msgs);
    		END IF;
	
			IF NOT EXISTS (SELECT 1 FROM registry.mf WHERE mfid = mf_id AND isd = 'false') THEN
   			 	messages := array_append(messages, 'INVALID_MF'::registry.devices_msgs);
			END IF;

			IF NOT EXISTS (SELECT 1 FROM registry.model WHERE mdid = md_id AND isd = 'false') THEN
    			messages := array_append(messages, 'INVALID_MODEL'::registry.devices_msgs);
			END IF;

		WHEN d_id IS NOT NULL THEN
   			IF NOT EXISTS (SELECT 1 FROM registry.devices WHERE did = d_id ) THEN
       		 messages := array_append(messages, 'INVALID_DEVICE'::registry.devices_msgs);
    		END IF;
			
			-- IF f_id IS NULL THEN
   --     		 messages := array_append(messages, 'EMPTY_UPDATE'::registry.devices_msgs);
   --  		END IF;				
			
	END CASE;
    RETURN messages;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.device_validator_writer(
    rowid INTEGER,
	d_id INTEGER,
	mf_id INTEGER,
    d_name VARCHAR,
    md_id INTEGER ,
    f_id INTEGER,
    e_by VARCHAR,
    e_id INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.devices_msgs[],d_ids INTEGER) AS $$
DECLARE
    devt registry.devts := 'DEVICE_ONBOARDED';
	device_id INTEGER := null;
	validator_result registry.devices_msgs[];
BEGIN
	validator_result := registry.device_validator(d_id,d_name,mf_id,md_id,f_id);
	
	IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,device_id;
		RETURN;
	END IF;
	
	CASE
		WHEN d_id IS NULL THEN
    		INSERT INTO registry.devices (eid, devt, eby, dname, mfid, mdid, fid)
    		VALUES (e_id, devt, e_by, d_name, mf_id, md_id, f_id)
			RETURNING did INTO device_id;
        	RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_INSERT']::registry.devices_msgs[],device_id;
		WHEN d_id IS NOT NULL THEN
    		UPDATE registry.devices
       		SET 
			    fid = f_id,
				eby = e_by,
				eid = e_id,
				eat = CURRENT_TIMESTAMP
       		WHERE did = d_id;
       		RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_UPDATE']::registry.devices_msgs[], d_id;
	END CASE;		
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.device_iterator(
	rowid INT[],
	d_id INT[],
	mf_id INT[],
    d_names TEXT[],
	mdid INT[] ,
    fid INT[],
    event_bys TEXT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.devices_msgs[], did INTEGER) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(rowid, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.device_validator_writer(
			rowid[i],
			d_id[i],
			mf_id[i],
    		d_names[i],
			mdid[i] ,
   			fid[i],
    		event_bys[i],   
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;

SELECT * FROM registry.device_iterator(
	ARRAY[1],
	ARRAY[6]::integer[],
	ARRAY[]::integer[],
    ARRAY[]::TEXT[], 
    ARRAY[]::integer[], 
    ARRAY[2]::integer[], 
    ARRAY[2], 
    ARRAY[28]
);

SELECT * FROM registry.device_iterator(
	ARRAY[1,2],
	ARRAY[]::integer[],
	ARRAY[6,6],
    ARRAY['device3', 'device4'], 
    ARRAY[1,1], 
    ARRAY[1,1], 
    ARRAY['2qw', '2qa'], 
    ARRAY[28, 28]
);

------------------------------------ONBOARD_FIRMWARE-----------------------------------------------------------------------

CREATE TYPE registry.firmware_msgs AS ENUM (
		'SUCCESS_INSERT',
		'FIRMWARE_REPEATED',
		'INVALID_MF'
);
		


CREATE OR REPLACE FUNCTION registry.firmware_validator(f_name VARCHAR,mf_id INTEGER) 
RETURNS registry.firmware_msgs[] AS $$
DECLARE
messages registry.firmware_msgs[];
BEGIN

   	IF EXISTS (SELECT 1 FROM registry.firmware WHERE fname = f_name ) THEN
        messages := array_append(messages, 'FIRMWARE_REPEATED'::registry.firmware_msgs);
    END IF;
	
	IF NOT EXISTS (SELECT 1 FROM registry.mf WHERE mfid = mf_id AND isd = 'false') THEN
    	messages := array_append(messages, 'INVALID_MF'::registry.firmware_msgs);
	END IF;
    RETURN messages;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.firmware_validator_writer(
    rowid INTEGER,
	mfid INTEGER,
    fname VARCHAR,
    eby VARCHAR,
    eid INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.firmware_msgs[],f_id INTEGER) AS $$
DECLARE
    frevt registry.frevts := 'FIRMWARE_ONBOARDED';
	f_id INTEGER := null;
	validator_result registry.firmware_msgs[];
BEGIN
	validator_result := registry.firmware_validator(fname,mfid);

    IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,f_id;
		RETURN;
	END IF;

    INSERT INTO registry.firmware (eid, frevt, eby, fname, mfid)
    VALUES (eid, frevt, eby, fname, mfid)
	RETURNING fid INTO f_id;
	RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_INSERT']::registry.firmware_msgs[],f_id;	
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.firmware_iterator(
	rowid INT[],
	mf_id INT[],
    f_names TEXT[],
    event_bys TEXT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.firmware_msgs[],fid INTEGER) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(f_names, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.firmware_validator_writer(
			rowid[i],
			mf_id[i],
    		f_names[i],
    		event_bys[i],   
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;

SELECT * FROM registry.firmware_iterator(
	ARRAY[1,2],
	ARRAY[3],
    ARRAY['firmware_v4', 'firmware_v3'],  
    ARRAY['1', '1'], 
    ARRAY[2, 2]
);




-------------------------------------------ONBOARD_MODEL------------------------------------------------------------
CREATE TYPE registry.models_msgs AS ENUM (
		'SUCCESS_INSERT',
		'MODEL_REPEATED',
		'INVALID_MF',
		'INVALID_FIRMWARE'
);
		


CREATE OR REPLACE FUNCTION registry.model_validator(md_name VARCHAR,mf_id INTEGER,f_id INTEGER) 
RETURNS registry.models_msgs[] AS $$
DECLARE
messages registry.models_msgs[];
BEGIN
   	IF EXISTS (SELECT 1 FROM registry.model WHERE mdname = md_name ) THEN
        messages := array_append(messages, 'MODEL_REPEATED'::registry.models_msgs);
    END IF;
	
	IF NOT EXISTS (SELECT 1 FROM registry.mf WHERE mfid = mf_id AND isd = 'false') THEN
    	messages := array_append(messages, 'INVALID_MF'::registry.models_msgs);
	END IF;
	
	IF NOT EXISTS (SELECT 1 FROM registry.firmware WHERE fid = f_id AND isd = 'false') THEN
    	messages := array_append(messages, 'INVALID_FIRMWARE'::registry.models_msgs);
	END IF;
    RETURN messages;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.model_validator_writer(
    rowid INTEGER,
	mfid INTEGER,
    mdname VARCHAR,
	fid INTEGER,
    eby VARCHAR,
    eid INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg  registry.models_msgs[],md_id INTEGER) AS $$
DECLARE
    mdevt registry.mdevts := 'MODEL_ONBOARDED';
	md_id INTEGER;
	validator_result  registry.models_msgs[];
BEGIN
	validator_result :=registry.model_validator(mdname,mfid,fid) ;

    IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,md_id;
		RETURN;
	END IF;

    INSERT INTO registry.model (eid, mdevt, eby, mdname, mfid,fid)
    VALUES (eid, mdevt, eby, mdname, mfid,fid)
	RETURNING mdid INTO md_id;
	RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_INSERT']::registry.models_msgs[],md_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.model_iterator(
	rowid INT[],
	mf_id INT[],
    md_names TEXT[],
	fid INT[],
    event_bys TEXT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg  registry.models_msgs[],mdid INTEGER) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(md_names, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.model_validator_writer(
			rowid[i],
			mf_id[i],
    		md_names[i],
			fid[i],
    		event_bys[i],   
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;


SELECT * FROM registry.model_iterator(
	ARRAY[1,2],
	ARRAY[5,5],
    ARRAY['model_v1', 'model_v2'],  
	ARRAY[1,1]::integer[],
    ARRAY['1',' 1'], 
    ARRAY[2, 2]
);


-------------------------------------------ONBOARD_VPA------------------------------------------------------------

CREATE TYPE registry.vpa_msgs AS ENUM (
		'SUCCESS_INSERT',
		'VPA_REPEATED',
		'INVALID_BANK'
);
	


CREATE OR REPLACE FUNCTION registry.vpa_validator(vpa_name VARCHAR,b_id INTEGER) 
RETURNS registry.vpa_msgs[] AS $$
DECLARE
messages registry.vpa_msgs[];
BEGIN
   	IF EXISTS (SELECT 1 FROM registry.vpa WHERE vpa = vpa_name ) THEN
        messages := array_append(messages, 'VPA_REPEATED'::registry.vpa_msgs);
    END IF;
	
	IF NOT EXISTS (SELECT 1 FROM registry.banks WHERE bid = b_id AND isd = 'false') THEN
    	messages := array_append(messages, 'INVALID_BANK'::registry.vpa_msgs);
	END IF;

    RETURN messages;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.vpa_validator_writer(
    rowid INTEGER,
    vpa VARCHAR,
	bid INTEGER,
    eby VARCHAR,
    eid INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.vpa_msgs[],v_id INTEGER) AS $$
DECLARE
    vevt registry.vevts := 'VPA_ONBOARDED';
	v_id INTEGER;
	validator_result registry.vpa_msgs[];
BEGIN
    validator_result := registry.vpa_validator(vpa,bid);
	
    IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,v_id;
		RETURN;
	END IF;	
	
    INSERT INTO registry.vpa (eid, vevt, eby, vpa,bid)
    VALUES (eid, vevt, eby, vpa,bid)
	RETURNING vid INTO v_id;
	RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_INSERT']::registry.vpa_msgs[],v_id;	
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.vpa_iterator(
	rowid INT[],
    vpa_name TEXT[],
	bid INT[],
    event_bys TEXT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.vpa_msgs[],vid INTEGER) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(rowid, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.vpa_validator_writer(
			rowid[i],
    		vpa_name[i],
			bid[i],
    		event_bys[i],   
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;


SELECT * FROM registry.vpa_iterator(
	ARRAY[1,2],
    ARRAY['te111111', 'tet1211'],  
	ARRAY[6,6],
    ARRAY['ui1', 'ip1'], 
    ARRAY[28, 28]
);




	



-------------------------------------------ONBOARD_MERCHANTS------------------------------------------------------------
CREATE TYPE registry.merchants_msgs AS ENUM (
		'SUCCESS_INSERT',
		'SUCCESS_UPDATE',
		'MERCHANT_REPEATED',
		'INVALID_BANK',
		'INVALID_MERCHANT',
		'INVALID_BRANCH',
		'EMPTY_UPDATE'
);
		


CREATE OR REPLACE FUNCTION registry.merchant_validator(mp_id INTEGER,m_name VARCHAR,br_id INTEGER,b_id INTEGER,m_info JSONB) 
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
		WHEN mp_id IS NOT NULL THEN
			IF NOT EXISTS (SELECT 1 FROM registry.merchants WHERE mpid = mp_id AND isd = 'false') THEN
        		messages := array_append(messages, 'INVALID_MERCHANT'::registry.merchants_msgs);
    		END IF;

			IF m_info = '{}' THEN
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
	b_id INTEGER,
	br_id INTEGER,
	m_info JSONB,
	ms_id INTEGER,
    e_by VARCHAR,
    e_id INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.merchants_msgs[],mp_ids INTEGER) AS $$
DECLARE
    mevt registry.mevts := 'MERCHANT_ONBOARDED';
	merchant_id INTEGER := null;
	validator_result registry.merchants_msgs[];
BEGIN
	validator_result := registry.merchant_validator(mp_id,m_name,br_id,b_id,m_info);
	   
    IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,merchant_id;
		RETURN;
	END IF;

	CASE 
		WHEN mp_id IS NULL THEN
    		INSERT INTO registry.merchants (eid, mevt, eby, mname,bid,brid,minfo,msid)
    		VALUES (e_id, mevt, e_by, m_name,b_id,br_id,m_info,ms_id)
			RETURNING mpid INTO merchant_id;
			RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_INSERT']::registry.merchants_msgs[],merchant_id;
		WHEN mp_id IS NOT NULL THEN
    		UPDATE registry.merchants
       		SET 
            	minfo = COALESCE(NULLIF(m_info::text, '{}'::text)::json, minfo),
				eby = e_by,
				eid = e_id,
				eat = CURRENT_TIMESTAMP
       		WHERE mpid = mp_id;
       		RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_UPDATE']::registry.merchants_msgs[], mp_id;

	END CASE;
			

END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.merchant_iterator(
	rowid INT[],
	mp_id INT[],
    m_name TEXT[],
	bid INT[],
	brid INT[],
	minfo JSONB[],
	msid INT[],
    event_bys VARCHAR[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.merchants_msgs[],mpid INTEGER) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(rowid, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.merchant_validator_writer(
			rowid[i],
			mp_id[i],
    		m_name[i],
			bid[i],
			brid[i],
			COALESCE(minfo[i],'{}'),
			msid[i],
    		event_bys[i],   
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;

SELECT * FROM registry.merchant_iterator(
	ARRAY[1,2],
	ARRAY[]::integer[],
    ARRAY['mer12', 'mer21'],  
	ARRAY[5,5],
	ARRAY[3,3],
	ARRAY[
        '{"name": "sbi", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}',
        '{"name": "aaa", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}'
    ]::jsonb[], 
	ARRAY[2,2],
    ARRAY['1',' 1'], 
    ARRAY[28, 28]
);

SELECT * FROM registry.merchant_iterator(
	ARRAY[1,2],
	ARRAY[8,9]::integer[],
    ARRAY[]::text[],  
	ARRAY[]::integer[],
	ARRAY[]::integer[],
	ARRAY[
        '{"name": "up", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}',
        '{"name": "up", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}'
    ]::jsonb[], 
	ARRAY[]::integer[],
    ARRAY['1', '1'], 
    ARRAY[28, 28]
);
