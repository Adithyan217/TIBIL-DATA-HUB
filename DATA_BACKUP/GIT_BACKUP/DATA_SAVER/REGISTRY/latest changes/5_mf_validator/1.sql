ALTER TABLE registry.mf
    ADD COLUMN max_cert_limit INT NOT NULL default 10,
ADD COLUMN generated_cert_count INT NOT NULL DEFAULT 0,
ADD COLUMN s3bkt VARCHAR ;

DROP FUNCTION IF EXISTS registry.mf_validator,registry.mf_validator_writer,registry.mf_iterator;


CREATE OR REPLACE FUNCTION registry.mf_validator(mf_id INTEGER,mf_name VARCHAR,mf_addr VARCHAR,mf_info JSONB,certno INTEGER) 
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
			IF mf_addr is null AND mf_info = '{}' AND certno IS NULL THEN
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
    e_id INTEGER,
	certno INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.mf_msgs[],mfnames VARCHAR) AS $$
DECLARE
    mf_evt registry.mfevts := 'MF_ONBOARDED';
	mf_names VARCHAR := NULL;
    validator_result registry.mf_msgs[];

BEGIN

	validator_result :=  registry.mf_validator(mf_id,mf_name,mf_addr,mf_info,certno);
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
    			max_cert_limit = COALESCE(NULLIF(max_cert_limit + certno, max_cert_limit), max_cert_limit),
				eby = e_by,
				eat = CURRENT_TIMESTAMP
       		WHERE mfid = mf_id
			RETURNING mfname INTO mf_names;
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
    eids INT[],
	certno INT[]
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
            COALESCE(eids[i],NULL),
			COALESCE(certno[i],NULL)
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;


-- SELECT * FROM registry.mf_iterator(
--     ARRAY[1],
--     ARRAY[1],                        -- mf_ids
--     ARRAY[]::text[],                     -- mf_names
--     ARRAY[]::text[],         -- mf_addrs
--     ARRAY[]::JSONB[],  -- mfinfo_list
--     ARRAY['admin', 'admin'],                 -- event_bys
--     ARRAY[10, 11],                           -- eids
--     ARRAY[1]::int[]                             -- certno
-- );

-- select * from registry.mf



select * from workflow.wfhsteps
