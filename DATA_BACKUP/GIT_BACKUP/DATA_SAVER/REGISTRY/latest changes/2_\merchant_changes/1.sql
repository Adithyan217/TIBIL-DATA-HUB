
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



SELECT * FROM registry.merchant_iterator(
    ARRAY[1]::INT[],                                 -- rowid
    ARRAY[NULL]::INT[],                              -- mp_id (NULL for insert; INT[] for update)
    ARRAY['Acme Corp']::TEXT[],                      -- m_name
    ARRAY['123 Acme St']::TEXT[],                    -- m_addr
    ARRAY['bank_1']::TEXT[],                   -- b_name
    ARRAY['branch_1']::TEXT[],                    -- br_name
    ARRAY['{"key": "value"}'::JSONB]::JSONB[],       -- minfo
    ARRAY[1001]::INT[],                              -- msid
    ARRAY['admin']::VARCHAR[],                       -- event_bys
    ARRAY[2001]::INT[],                              -- eids
    ARRAY['Type 1']::TEXT[]                          -- m_type
);
