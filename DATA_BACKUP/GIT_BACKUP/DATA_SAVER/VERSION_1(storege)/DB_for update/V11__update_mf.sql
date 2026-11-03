
-----------------------------update manufacturer-----------
DROP FUNCTION IF EXISTS 
    registry.mf_validator,
    registry.mf_validator_writer,
    registry.mf_iterator


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



----------------------added maddr in merchants--------

ALTER TABLE registry.merchants
ADD COLUMN maddr VARCHAR;

ALTER TABLE registry.merchants_v
ADD COLUMN maddr VARCHAR;


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
	validator_result := registry.merchant_validator(mp_id,m_name,br_id,b_id,m_info,m_addr);
	   
    IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,merchant_id;
		RETURN;
	END IF;

	CASE 
		WHEN mp_id IS NULL THEN
    		INSERT INTO registry.merchants (eid, mevt, eby, mname,bid,brid,minfo,msid,maddr)
    		VALUES (e_id, mevt, e_by, m_name,b_id,br_id,m_info,ms_id,m_addr)
			RETURNING mpid INTO merchant_id;
			RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_INSERT']::registry.merchants_msgs[],merchant_id;
		WHEN mp_id IS NOT NULL THEN
    		UPDATE registry.merchants
       		SET 
            	minfo = COALESCE(NULLIF(m_info::text, '{}'::text)::json, minfo),
				maddr = COALESCE(m_addr,maddr),
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
	m_addr TEXT[],
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
			COALESCE(NULLIF(m_addr[i],''),NULL),
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
