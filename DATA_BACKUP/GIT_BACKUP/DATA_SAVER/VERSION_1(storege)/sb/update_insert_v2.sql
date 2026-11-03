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
			IF b_addr = null AND b_info = '{}' THEN
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
    e_by INTEGER,
    eid INTEGER
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
    		VALUES (b_name, b_addr, bevt, b_info, eby, eid)
   			RETURNING bid INTO bank_id ;
   			RETURN QUERY SELECT rowid, 1, 'SUCCESS_INSERT'::registry.banks_msgs,bank_id;
				
		WHEN b_id IS NOT NULL THEN 
    		UPDATE registry.banks
       		SET 
           		baddr = COALESCE(b_addr, baddr),
            	binfo = COALESCE(NULLIF(b_info::text, '{}'::text)::json, binfo),
				eby = e_by,
				eat = CURRENT_TIMESTAMP
       		WHERE bid = b_id;
       		RETURN QUERY SELECT rowid, 1, 'SUCCESS_UPDATE'::registry.banks_msgs, b_id;

	END CASE;


END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.bank_iterator(
	rowid INT[],
	bank_id INT[],
    bank_names TEXT[],
    bank_addrs TEXT[],
    binfo_list JSONB[],
    event_bys INT[],
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
            COALESCE(bank_names[i],NULL),
            COALESCE(bank_addrs[i],NULL), 
            COALESCE(binfo_list[i],'{}'::jsonb), 
            COALESCE(event_bys[i],NULL), 
            COALESCE(eids[i],NULL)
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;


EXPLAIN ANALYZE
SELECT row_id,status,msg,bid FROM registry.bank_iterator(
	ARRAY[1],
	ARRAY[111],
    ARRAY[]::TEXT[], 
    ARRAY[]::TEXT[], 
    ARRAY[]::jsonb[], 
    ARRAY[1], 
    ARRAY[]::integer[]
);


SELECT row_id,status,msg,bank_ids FROM registry.bank_validator_writer(
	1,11,null,null,'{}',1,null
)
