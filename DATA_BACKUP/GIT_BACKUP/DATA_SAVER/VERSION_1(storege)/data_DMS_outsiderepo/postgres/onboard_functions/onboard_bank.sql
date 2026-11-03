CREATE OR REPLACE FUNCTION dmsr.bank_validator(b_name VARCHAR ) 
RETURNS BOOLEAN AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM dmsr.banks WHERE dmsr.banks.bname = b_name) THEN
        RETURN FALSE;
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION dmsr.bank_validator_writer(
    rowid INTEGER,
    bname VARCHAR,
    baddr VARCHAR,
    binfo jsonb,
    eby INTEGER,
    eid INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,b_id INTEGER) AS $$
DECLARE
    bank_id INTEGER;
    bevt dmsr.bevts := 'BANK_ONBOARDED';
BEGIN
    IF dmsr.bank_validator(bname) THEN
    	INSERT INTO dmsr.banks (bname, baddr, bevt, binfo, eby, eid)
    	VALUES (bname, baddr, bevt, binfo, eby, eid)
    	RETURNING bid INTO bank_id ;
    	RETURN QUERY SELECT rowid, 1, 'Insertion Successful',bank_id;
	ELSE 
		RETURN QUERY SELECT rowid, 0, 'Validation Failed',0;
	END IF;

	
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION dmsr.bank_iterator(
	rowid INT[],
    bank_names TEXT[],
    bank_addrs TEXT[],
    binfo_list JSONB[],
    event_bys INT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,bid INTEGER) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(bank_names, 1) LOOP
  
        RETURN QUERY SELECT * FROM dmsr.bank_validator_writer(
			rowid[i],
            bank_names[i], 
            bank_addrs[i], 
            binfo_list[i], 
            event_bys[i], 
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;



SELECT * FROM dmsr.bank_iterator(
	ARRAY[1,2],
    ARRAY['test12', 'test211111111'], 
    ARRAY['1st Main Road', '2nd Main Road'], 
    ARRAY[
        '{"name": "sbi", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}',
        '{"name": "aaa", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}'
    ]::jsonb[], 
    ARRAY[1, 2], 
    ARRAY[28, 29]
);
