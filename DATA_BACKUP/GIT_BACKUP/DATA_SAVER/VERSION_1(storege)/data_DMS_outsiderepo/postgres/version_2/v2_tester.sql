
	



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
		


CREATE OR REPLACE FUNCTION registry.merchant_validator(mp_id INTEGER,m_name VARCHAR,br_id INTEGER,b_id INTEGER) 
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
    e_by INTEGER,
    e_id INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.merchants_msgs[],mp_ids INTEGER) AS $$
DECLARE
    mevt registry.mevts := 'MERCHANT_ONBOARDED';
	merchant_id INTEGER := null;
	validator_result registry.merchants_msgs[];
BEGIN
	validator_result := registry.merchant_validator(mp_id,m_name,br_id,b_id);
	   
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
    event_bys INT[],
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
			minfo[i],
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
    ARRAY['mer1', 'mer2'],  
	ARRAY[5,5],
	ARRAY[3,3],
	ARRAY[
        '{"name": "sbi", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}',
        '{"name": "aaa", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}'
    ]::jsonb[], 
	ARRAY[2,2],
    ARRAY[1, 1], 
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
    ARRAY[1, 1], 
    ARRAY[28, 28]
);
