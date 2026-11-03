
CREATE OR REPLACE FUNCTION dmsr.branch_validator(br_name VARCHAR,b_id INTEGER) 
RETURNS BOOLEAN AS $$
BEGIN
   	IF EXISTS (SELECT 1 FROM dmsr.branches WHERE brname = br_name ) THEN
            RETURN FALSE;
    END IF;
	
	IF NOT EXISTS (SELECT 1 FROM dmsr.banks WHERE bid = b_id AND isd = 'false') THEN
    		RETURN FALSE;
	END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION dmsr.branch_validator_writer(
    rowid INTEGER,
	bid INTEGER,
    brname VARCHAR,
    braddr VARCHAR,
    brinfo jsonb,
    eby INTEGER,
    eid INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,br_id INTEGER) AS $$
DECLARE
    brevt dmsr.brevts := 'BRANCH_ONBOARDED';
    br_id INTEGER;
BEGIN
    IF dmsr.branch_validator(brname,bid) THEN
    	INSERT INTO dmsr.branches (brname,bid, braddr, brevt, brinfo, eby, eid)
    	VALUES (brname,bid, braddr, brevt, brinfo, eby, eid)
        RETURNING brid INTO br_id;
        RETURN QUERY SELECT rowid, 1, 'Insertion Successful',br_id;
	ELSE 
		RETURN QUERY SELECT rowid, 0, 'Validation Failed',0;
	END IF;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION dmsr.branch_iterator(
	rowid INT[],
	bank_id INT[],
    br_names TEXT[],
    br_addrs TEXT[],
    brinfo_list JSONB[],
    event_bys INT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,brid INTEGER) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(br_names, 1) LOOP
  
        RETURN QUERY SELECT * FROM dmsr.branch_validator_writer(
			rowid[i],
			bank_id[i],
            br_names[i], 
            br_addrs[i], 
            brinfo_list[i], 
            event_bys[i], 
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;


SELECT * FROM dmsr.branch_iterator(
	ARRAY[1,2],
	ARRAY[1,1],
    ARRAY['test11111111', 'test211111111111'], 
    ARRAY['1st Main Road', '2nd Main Road'], 
    ARRAY[
        '{"name": "sbi", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}',
        '{"name": "aaa", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}'
    ]::jsonb[], 
    ARRAY[1, 1], 
    ARRAY[28, 28]
);
