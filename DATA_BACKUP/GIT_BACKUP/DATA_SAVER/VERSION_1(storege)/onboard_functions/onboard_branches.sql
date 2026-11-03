CREATE TYPE registry.branches_msgs AS ENUM (
		'SUCCESS_INSERT',
		'BRANCH_REPEATED',
		'INVALID_BANK',
		'EMPTY_UPDATE'
);



CREATE OR REPLACE FUNCTION registry.branch_validator(br_name VARCHAR,b_id INTEGER) 
RETURNS registry.branches_msgs[] AS $$
DECLARE messages registry.branches_msgs[];
BEGIN
   	IF EXISTS (SELECT 1 FROM registry.branches WHERE brname = br_name ) THEN
            messages := array_append(messages, 'BRANCH_REPEATED'::registry.branches_msgs);
    END IF;
	
	IF NOT EXISTS (SELECT 1 FROM registry.banks WHERE bid = b_id AND isd = 'false') THEN
            messages := array_append(messages, 'INVALID_BANK'::registry.branches_msgs);
	END IF;

    RETURN messages;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.branch_validator_writer(
    rowid INTEGER,
	b_id INTEGER,
    br_name VARCHAR,
    br_addr VARCHAR,
    br_info jsonb,
    e_by INTEGER,
    e_id INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.branches_msgs[],br_ids INTEGER) AS $$
DECLARE
    br_evt registry.brevts := 'BRANCH_ONBOARDED';
    br_id INTEGER := NULL;
	validator_result registry.branches_msgs[];
BEGIN
	validator_result := registry.branch_validator(br_name,b_id);

    IF array_length(validator_result, 1) > 0 THEN
	    RETURN QUERY SELECT rowid,0,validator_result,br_id;
	    RETURN;
	END IF;

    INSERT INTO registry.branches (brname,bid, braddr, brevt, brinfo, eby, eid)
    VALUES (br_name,b_id, br_addr, br_evt, br_info, e_by, e_id)
    RETURNING brid INTO br_id;
    RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_INSERT']::registry.branches_msgs[],br_id;

END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.branch_iterator(
	rowid INT[],
	bank_id INT[],
    br_names TEXT[],
    br_addrs TEXT[],
    brinfo_list JSONB[],
    event_bys INT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.branches_msgs[],brid INTEGER) AS $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(rowid, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.branch_validator_writer(
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


SELECT * FROM registry.branch_iterator(
	ARRAY[1,2],
	ARRAY[52,52],
    ARRAY['branch1', 'branch2'], 
    ARRAY['1st Main Road', '2nd Main Road'], 
    ARRAY[
        '{"name": "sbi", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}',
        '{"name": "aaa", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}'
    ]::jsonb[], 
    ARRAY[1, 1], 
    ARRAY[2, 2]
);