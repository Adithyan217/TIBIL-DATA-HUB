------------------------------------------ BRANCH CODE

ALTER TABLE registry.branches ADD COLUMN brcode INT UNIQUE

CREATE INDEX IF NOT EXISTS idx_branches_brcode
ON registry.branches(brcode)


ALTER TYPE registry.branches_msgs ADD VALUE 'BRANCH_CODE_REPEATED';


DROP FUNCTION IF EXISTS registry.branch_iterator,registry.branch_validator,registry.branch_validator_writer

CREATE OR REPLACE FUNCTION registry.branch_validator(br_name VARCHAR,b_id INTEGER,br_id INTEGER,br_addr VARCHAR,br_info jsonb,br_code INTEGER) 
RETURNS registry.branches_msgs[] AS $$
DECLARE messages registry.branches_msgs[];
BEGIN
	CASE
		WHEN br_id IS NULL THEN
   			IF EXISTS (SELECT 1 FROM registry.branches WHERE brname = br_name ) THEN
           		 messages := array_append(messages, 'BRANCH_REPEATED'::registry.branches_msgs);
  		  	END IF;

   			IF EXISTS (SELECT 1 FROM registry.branches WHERE brcode = br_code ) THEN
           		 messages := array_append(messages, 'BRANCH_CODE_REPEATED'::registry.branches_msgs);
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
	br_code INTEGER,
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

	validator_result := registry.branch_validator(br_name,b_id,br_id,br_addr,br_info,br_code);

    IF array_length(validator_result, 1) > 0 THEN
	    RETURN QUERY SELECT rowid,0,validator_result,branch_name;
	    RETURN;
	END IF;
	CASE
		WHEN br_id IS NULL THEN
   			INSERT INTO registry.branches (brcode,brname,bid, braddr, brevt, brinfo, eby, eid)
    		VALUES (br_code,br_name,b_id, br_addr, br_evt, br_info, e_by, e_id)
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
	br_code INT[],
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
			br_code[i],
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




SELECT * FROM registry.branch_iterator(
	ARRAY[1],
	ARRAY[110980]::integer[],
	ARRAY[1234]::integer[],
	ARRAY['bank_1']::text[],
    ARRAY['branch_br1']::text[], 
    ARRAY['2nd Main Road'], 
    ARRAY[
        '{"name": "ARIVU", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}'
    ]::jsonb[], 
    ARRAY['1'], 
    ARRAY[2]
);