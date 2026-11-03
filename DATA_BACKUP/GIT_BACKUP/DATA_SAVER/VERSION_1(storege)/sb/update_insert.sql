CREATE OR REPLACE FUNCTION registry.bank_validator(b_name VARCHAR,b_id INTEGER,b_addr VARCHAR,b_info JSONB) 
RETURNS INTEGER AS $$
BEGIN
	IF b_id IS NULL THEN
    	IF EXISTS (SELECT 1 FROM registry.banks WHERE bname = b_name) THEN
        	RETURN 0;
		END IF;
		RETURN 1;
	ELSE 
		IF b_addr = null OR b_info = '{}' THEN
			RETURN 3;
		ELSIF NOT EXISTS (SELECT 1 FROM registry.banks WHERE bid = b_id and isd = FALSE) THEN
			RETURN 4;
		END IF;
		RETURN 2;
    END IF;
    
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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,bank_ids INTEGER) AS $$
DECLARE
    bank_id INTEGER := NULL;
    bevt registry.bevts := 'BANK_ONBOARDED';
	validator_result INTEGER;
BEGIN
	validator_result :=  registry.bank_validator(b_name,b_id,b_addr,b_info);
	   
	IF validator_result = 0 THEN
		RETURN QUERY SELECT rowid,0,'bank_name repeated',bank_id;

	ELSIF validator_result = 1 THEN
    	INSERT INTO registry.banks (bname, baddr, bevt, binfo, eby, eid)
    	VALUES (b_name, b_addr, bevt, b_info, eby, eid)
   		RETURNING bid INTO bank_id ;
   		RETURN QUERY SELECT rowid, 1, 'Insertion Successful',bank_id;
				
	ELSIF validator_result = 2 THEN
    	UPDATE registry.banks
       	SET 
           	baddr = COALESCE(b_addr, baddr),
            binfo = COALESCE(NULLIF(b_info::text, '{}'::text)::json, binfo),
			eby = e_by
       	WHERE bid = b_id;
       	RETURN QUERY SELECT rowid, 1, 'Update Successful', b_id;
		   
	ELSIF validator_result = 3 THEN
		RETURN QUERY SELECT rowid,0,'empty values',bank_id;
	ELSE 
		RETURN QUERY SELECT rowid,0,'bank_id invalid',bank_id;
	END IF;


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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,bid INTEGER) AS $$
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
    ARRAY['updated']::TEXT[], 
    ARRAY[]::jsonb[], 
    ARRAY[1], 
    ARRAY[]::integer[]
);


SELECT row_id,status,msg,bank_ids FROM registry.bank_validator_writer(
	1,11,null,null,'{}',1,null
)
