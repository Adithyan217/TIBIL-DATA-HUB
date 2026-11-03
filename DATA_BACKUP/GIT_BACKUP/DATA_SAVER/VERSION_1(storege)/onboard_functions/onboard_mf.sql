CREATE TYPE registry.mf_msgs AS ENUM (
		'SUCCESS_INSERT',
		'SUCCESS_UPDATE',
		'MF_REPEATED',
		'INVALID_MF',
		'EMPTY_UPDATE'
);

CREATE OR REPLACE FUNCTION registry.mf_validator(mf_name VARCHAR,mf_id INTEGER,mf_addr VARCHAR,mf_info JSONB) 
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
    e_by INTEGER,
    e_id INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.mf_msgs[],mf_ids INTEGER) AS $$
DECLARE
    mf_evt registry.mfevts := 'MF_ONBOARDED';
	mf_ids INTEGER := NULL;
    validator_result registry.mf_msgs[];

BEGIN

	validator_result :=  registry.mf_validator(mf_name,mf_id,mf_addr,mf_info);
    IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,mf_id;
		RETURN;
	END IF;


    CASE 
		WHEN mf_id IS NULL THEN
    		INSERT INTO registry.mf (mfname, mfaddr, mfevt, mfinfo, eby, eid)
    	    VALUES (mf_name, mf_addr, mf_evt, mf_info, e_by, e_id)
		    RETURNING mfid INTO mf_ids;
   			RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_INSERT']::registry.mf_msgs,mf_ids;
				
		WHEN mf_id IS NOT NULL THEN 
    		UPDATE registry.mf
       		SET 
           		mfaddr = COALESCE(mf_addr, mfaddr),
            	mfinfo = COALESCE(NULLIF(mf_info::text, '{}'::text)::json, mfinfo),
				eby = e_by,
				eat = CURRENT_TIMESTAMP
       		WHERE mfid = mf_id;
       		RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_UPDATE']::registry.mf_msgs, mf_id;

	END CASE;

END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.mf_iterator(
	rowid INT[],
    mf_ids INTEGER[],
    mf_names TEXT[],
    mf_addrs TEXT[],
    mfinfo_list JSONB[],
    event_bys INT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.mf_msgs[],mf_id INTEGER) AS $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(rowid, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.mf_validator_writer(
			rowid[i],
            COALESCE(mf_ids[i], NULL) ,
            COALESCE(mf_names[i],NULL),
            COALESCE(mf_addrs[i],NULL), 
            COALESCE(mfinfo_list[i],'{}'::jsonb), 
            COALESCE(event_bys[i],NULL), 
            COALESCE(eids[i],NULL)
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;

SELECT * FROM registry.mf_iterator(
	ARRAY[1,2],
	ARRAY[31,3]::integer[],
    ARRAY[]::VARCHAR[], 
    ARRAY[]::VARCHAR[] , 
    ARRAY[]::jsonb[], 
    ARRAY[1, 1], 
    ARRAY[2, 2]
);