DROP FUNCTION IF EXISTS 
    registry.bank_validator,
    registry.bank_validator_writer,
    registry.bank_iterator,
    registry.mf_validator,
    registry.mf_validator_writer,
    registry.mf_iterator,
    registry.branch_validator,
    registry.branch_validator_writer,
    registry.branch_iterator,
    registry.device_validator,
    registry.device_validator_writer,
    registry.device_iterator,
    registry.firmware_validator,
    registry.firmware_validator_writer,
    registry.firmware_iterator,
    registry.model_validator,
    registry.model_validator_writer,
    registry.model_iterator,
    registry.vpa_validator,
    registry.vpa_validator_writer,
    registry.vpa_iterator,
    registry.merchant_validator,
    registry.merchant_validator_writer,
    registry.merchant_iterator;






-- For main tables

ALTER TABLE registry.banks ALTER COLUMN eby TYPE VARCHAR;
ALTER TABLE registry.branches ALTER COLUMN eby TYPE VARCHAR;
ALTER TABLE registry.mf ALTER COLUMN eby TYPE VARCHAR;
ALTER TABLE registry.vpa ALTER COLUMN eby TYPE VARCHAR;
ALTER TABLE registry.merchants ALTER COLUMN eby TYPE VARCHAR;
ALTER TABLE registry.devices ALTER COLUMN eby TYPE VARCHAR;
ALTER TABLE registry.sb ALTER COLUMN eby TYPE VARCHAR;
ALTER TABLE registry.firmware ALTER COLUMN eby TYPE VARCHAR;
ALTER TABLE registry.model ALTER COLUMN eby TYPE VARCHAR;


-- For `_v` tables
ALTER TABLE registry.banks_v ALTER COLUMN eby TYPE VARCHAR;
ALTER TABLE registry.branches_v ALTER COLUMN eby TYPE VARCHAR;
ALTER TABLE registry.mf_v ALTER COLUMN eby TYPE VARCHAR;
ALTER TABLE registry.vpa_v ALTER COLUMN eby TYPE VARCHAR;
ALTER TABLE registry.merchants_v ALTER COLUMN eby TYPE VARCHAR;
ALTER TABLE registry.devices_v ALTER COLUMN eby TYPE VARCHAR;
ALTER TABLE registry.sb_v ALTER COLUMN eby TYPE VARCHAR;
ALTER TABLE registry.firmware_v ALTER COLUMN eby TYPE VARCHAR;
ALTER TABLE registry.model_v ALTER COLUMN eby TYPE VARCHAR;






--------------------------------------------------------------------------------------------------------------------------------
----------------------------------------------------BANKS_ONBOARD----------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------------------




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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.banks_msgs[],bank_name VARCHAR) AS $$
DECLARE
    bank_name VARCHAR := NULL;
    bevt registry.bevts := 'BANK_ONBOARDED';
	validator_result registry.banks_msgs[];
BEGIN
	
	validator_result :=  registry.bank_validator(b_name,b_id,b_addr,b_info);
	   
    IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,bank_name;
		RETURN;
	END IF;

	CASE 
		WHEN b_id IS NULL THEN
    		INSERT INTO registry.banks (bname, baddr, bevt, binfo, eby, eid)
    		VALUES (b_name, b_addr, bevt, b_info, e_by, e_id)
   			RETURNING bname INTO bank_name ;
   			RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_INSERT']::registry.banks_msgs[],bank_name;
				
		WHEN b_id IS NOT NULL THEN 
    		UPDATE registry.banks
       		SET 
           		baddr = COALESCE(b_addr, baddr),
            	binfo = COALESCE(NULLIF(b_info::text, '{}'::text)::json, binfo),
				eby = e_by,
				eid = e_id,
				eat = CURRENT_TIMESTAMP
       		WHERE bid = b_id
			RETURNING bname INTO bank_name;
       		RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_UPDATE']::registry.banks_msgs[], bank_name;

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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.banks_msgs[],bid VARCHAR) AS $$
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




--------------------------------------------------------------------------------------------------------------------------------
----------------------------------------------------ONBOARD_MF----------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------------------


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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.mf_msgs[],mfnames VARCHAR) AS $$
DECLARE
    mf_evt registry.mfevts := 'MF_ONBOARDED';
	mf_names VARCHAR := NULL;
    validator_result registry.mf_msgs[];

BEGIN

	validator_result :=  registry.mf_validator(mf_id,mf_name,mf_addr,mf_info);
    IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,mf_names;
		RETURN;
	END IF;


    CASE 
		WHEN mf_id IS NULL THEN
    		INSERT INTO registry.mf (mfname, mfaddr, mfevt, mfinfo, eby, eid)
    	    VALUES (mf_name, mf_addr, mf_evt, mf_info, e_by, e_id)
		    RETURNING mfname INTO mf_names;
   			RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_INSERT']::registry.mf_msgs[],mf_names;
				
		WHEN mf_id IS NOT NULL THEN 
    		UPDATE registry.mf
       		SET 
           		mfaddr = COALESCE(mf_addr, mfaddr),
            	mfinfo = COALESCE(NULLIF(mf_info::text, '{}'::text)::json, mfinfo),
				eby = e_by,
				eat = CURRENT_TIMESTAMP
       		WHERE mfid = mf_id;
       		RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_UPDATE']::registry.mf_msgs[], mf_names;

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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.mf_msgs[],mfid VARCHAR) AS $$
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



-----------------------------------------------ONBOARD_BRANCH-----------------------------------


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
	b_name VARCHAR,
    br_name VARCHAR,
    br_addr VARCHAR,
    br_info jsonb,
    e_by VARCHAR,
    e_id INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.branches_msgs[],br_names VARCHAR) AS $$
DECLARE
    b_id INTEGER := NULL;
    br_evt registry.brevts := 'BRANCH_ONBOARDED';
    branch_name VARCHAR := NULL;
	validator_result registry.branches_msgs[];
BEGIN

    SELECT bid INTO b_id FROM registry.banks WHERE bname = b_name;

	validator_result := registry.branch_validator(br_name,b_id,br_id,br_addr,br_info);

    IF array_length(validator_result, 1) > 0 THEN
	    RETURN QUERY SELECT rowid,0,validator_result,branch_name;
	    RETURN;
	END IF;
	CASE
		WHEN br_id IS NULL THEN
   			INSERT INTO registry.branches (brname,bid, braddr, brevt, brinfo, eby, eid)
    		VALUES (br_name,b_id, br_addr, br_evt, br_info, e_by, e_id)
   		 	RETURNING brname INTO branch_name;
   		 	RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_INSERT']::registry.branches_msgs[],branch_name;
				
		WHEN br_id IS NOT NULL THEN
    		UPDATE registry.branches
       		SET 
           		braddr = COALESCE(br_addr,braddr),
            	brinfo = COALESCE(NULLIF(br_info::text, '{}'::text)::json, brinfo),
				eby = e_by,
				eid = e_id,
				eat = CURRENT_TIMESTAMP
       		WHERE brid = br_id
			RETURNING brname INTO branch_name;
       		RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_UPDATE']::registry.branches_msgs[], branch_name;

	END CASE;    

END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.branch_iterator(
	rowid INT[],
	br_id INT[],
	bank_names TEXT[],
    br_names TEXT[],
    br_addrs TEXT[],
    brinfo_list JSONB[],
    event_bys TEXT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.branches_msgs[],brid VARCHAR) AS $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(rowid, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.branch_validator_writer(
			rowid[i],
			COALESCE(br_id[i],NULL),
            COALESCE(NULLIF(bank_names[i],''),NULL),
            COALESCE(NULLIF(br_names[i],''),NULL),
            COALESCE(NULLIF(br_addrs[i],''),NULL),
            COALESCE(brinfo_list[i],'{}'::jsonb), 
            event_bys[i], 
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;





-------------------------------------------ONBOARD_DEVICES------------------------------------------------------------


ALTER TYPE registry.devices_msgs ADD VALUE 'IMEI_REPEATED';

ALTER TABLE registry.devices ADD COLUMN imei VARCHAR;

CREATE OR REPLACE FUNCTION registry.device_validator(d_id INTEGER,d_name VARCHAR,mf_id INTEGER,md_id INTEGER,f_id INTEGER,imei_ VARCHAR ) 
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

			IF EXISTS (SELECT 1 FROM registry.devices WHERE imei = imei_ AND isd = 'false') THEN
    			messages := array_append(messages, 'IMEI_REPEATED'::registry.devices_msgs);
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
	mf_name VARCHAR,
    d_name VARCHAR,
    md_name VARCHAR ,
    f_name VARCHAR,
	imei_ VARCHAR,
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
BEGIN

    SELECT mfid INTO mf_id FROM registry.mf WHERE mfname = mf_name;
    SELECT mdid INTO md_id FROM registry.model WHERE mdname = md_name;
    SELECT fid INTO f_id FROM registry.firmware WHERE fname = f_name;

	validator_result := registry.device_validator(d_id,d_name,mf_id,md_id,f_id,imei_);
	
	IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,device_name;
		RETURN;
	END IF;
	
	CASE
		WHEN d_id IS NULL THEN
    		INSERT INTO registry.devices (eid, devt, eby, dname, mfid, mdid, fid,imei)
    		VALUES (e_id, devt, e_by, d_name, mf_id, md_id, f_id,imei_)
			RETURNING dname INTO device_name;
        	RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_INSERT']::registry.devices_msgs[],device_name;
		WHEN d_id IS NOT NULL THEN
    		UPDATE registry.devices
       		SET 
			    fid = f_id,
				eby = e_by,
				eid = e_id,
				eat = CURRENT_TIMESTAMP
       		WHERE did = d_id
            RETURNING dname INTO device_name;
       		RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_UPDATE']::registry.devices_msgs[], device_name;
	END CASE;		
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.device_iterator(
	rowid INT[],
	d_id INT[],
	mf_name TEXT[],
    d_names TEXT[],
	md_name TEXT[] ,
    f_name TEXT[],
	imei TEXT[],
    event_bys TEXT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.devices_msgs[], did VARCHAR) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(rowid, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.device_validator_writer(
			rowid[i],
			d_id[i],
			mf_name[i],
    		d_names[i],
			md_name[i] ,
   			f_name[i],
			imei[i],
    		event_bys[i],   
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;


------------------------------------ONBOARD_FIRMWARE-----------------------------------------------------------------------

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
	mf_name VARCHAR,
    f_name VARCHAR,
    e_by VARCHAR,
    e_id INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.firmware_msgs[],fnames VARCHAR) AS $$
DECLARE
	mf_id INTEGER := NULL;
    fr_evt registry.frevts := 'FIRMWARE_ONBOARDED';
	validator_result registry.firmware_msgs[];
    f_names VARCHAR := NULL;
BEGIN

	SELECT mfid INTO mf_id FROM registry.mf WHERE mfname = mf_name; 

	validator_result := registry.firmware_validator(f_name,mf_id);

    IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,f_names;
		RETURN;
	END IF;

    INSERT INTO registry.firmware (eid, frevt, eby, fname, mfid)
    VALUES (e_id, fr_evt, e_by, f_name, mf_id)
    RETURNING fname INTO f_names;
	RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_INSERT']::registry.firmware_msgs[],f_names;	
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.firmware_iterator(
	rowid INT[],
	mf_name TEXT[],
    f_names TEXT[],
    event_bys TEXT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.firmware_msgs[],fid VARCHAR) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(f_names, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.firmware_validator_writer(
			rowid[i],
			mf_name[i],
    		f_names[i],
    		event_bys[i],   
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;




-------------------------------------------ONBOARD_MODEL------------------------------------------------------------	


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
	mf_name VARCHAR,
    md_name VARCHAR,
	f_name VARCHAR,
    e_by VARCHAR,
    e_id INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg  registry.models_msgs[],mdnames VARCHAR) AS $$
DECLARE
    md_evt registry.mdevts := 'MODEL_ONBOARDED';
	validator_result  registry.models_msgs[];
	mf_id INTEGER := NULL;
	f_id INTEGER := NULL;
    md_names VARCHAR := NULL;
BEGIN
	SELECT mfid INTO mf_id FROM registry.mf WHERE mfname = mf_name;
	SELECT fid INTO f_id FROM registry.firmware WHERE fname = f_name;

	validator_result :=registry.model_validator(md_name,mf_id,f_id) ;

    IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,md_names;
		RETURN;
	END IF;

    INSERT INTO registry.model (eid, mdevt, eby, mdname, mfid,fid)
    VALUES (e_id, md_evt, e_by, md_name, mf_id,f_id)
    RETURNING mdname INTO md_names;
	RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_INSERT']::registry.models_msgs[],md_names;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.model_iterator(
	rowid INT[],
	mf_names TEXT[],
    md_names TEXT[],
	f_names TEXT[],
    event_bys TEXT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg  registry.models_msgs[],mdid VARCHAR) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(md_names, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.model_validator_writer(
			rowid[i],
			mf_names[i],
    		md_names[i],
			f_names[i],
    		event_bys[i],   
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;



-------------------------------------------ONBOARD_VPA------------------------------------------------------------
	



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
    _vpa VARCHAR,
	b_name VARCHAR,
    e_by VARCHAR,
    e_id INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.vpa_msgs[],vpa_name VARCHAR) AS $$
DECLARE
    v_evt registry.vevts := 'VPA_ONBOARDED';
	validator_result registry.vpa_msgs[];
    b_id INTEGER := NULL;
    vpa_ VARCHAR := NULL;   
BEGIN
    SELECT bid INTO b_id FROM registry.banks WHERE bname = b_name;

    validator_result := registry.vpa_validator(vpa,b_id);
	
    IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,_vpa;
		RETURN;
	END IF;	
	
    INSERT INTO registry.vpa (eid, vevt, eby, vpa,bid)
    VALUES (e_id, v_evt, e_by, _vpa,b_id)
    RETURNING vpa INTO vpa_;
	RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_INSERT']::registry.vpa_msgs[],vpa_;	
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.vpa_iterator(
	rowid INT[],
    vpa_name TEXT[],
	b_name TEXT[],
    event_bys TEXT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.vpa_msgs[],vid VARCHAR) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(rowid, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.vpa_validator_writer(
			rowid[i],
    		vpa_name[i],
			b_name[i],
    		event_bys[i],   
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;







	



-------------------------------------------ONBOARD_MERCHANTS------------------------------------------------------------




CREATE OR REPLACE FUNCTION registry.merchant_validator(mp_id INTEGER,m_name VARCHAR,br_id INTEGER,b_id INTEGER,m_info JSONB,m_addr VARCHAR) 
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
    e_id INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.merchants_msgs[],mp_ids VARCHAR) AS $$
DECLARE
    m_evt registry.mevts := 'MERCHANT_ONBOARDED';
	merchant_name VARCHAR := null;
	validator_result registry.merchants_msgs[];
    b_id INTEGER := NULL;
    br_id INTEGER := NULL;
	
BEGIN

    SELECT bid INTO b_id FROM registry.banks WHERE bname = b_name;
    SELECT brid INTO br_id FROM registry.branches WHERE brname = br_name;

	validator_result := registry.merchant_validator(mp_id,m_name,br_id,b_id,m_info,m_addr);
	   
    IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,merchant_name;
		RETURN;
	END IF;

	CASE 
		WHEN mp_id IS NULL THEN
    		INSERT INTO registry.merchants (eid, mevt, eby, mname,bid,brid,minfo,msid,maddr)
    		VALUES (e_id, m_evt, e_by, m_name,b_id,br_id,m_info,ms_id,m_addr)
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
    eids INT[]
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
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;
