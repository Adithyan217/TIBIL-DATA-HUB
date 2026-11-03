-----------------------------------------------------------------------------------------------------------------
---------------------------------------------------ONBOARD BANKS---------------------------------------------------------------
-----------------------------------------------------------------------------------------------------------------



CREATE OR REPLACE FUNCTION dmsr.bank_validator(input_data JSONB) 
RETURNS BOOLEAN AS $$
DECLARE

    edetails JSONB;
    i INT;
    edetail JSONB;
    bank_name VARCHAR;
    existing_bank_names TEXT[];
	input_bank_names TEXT[] := '{}';
BEGIN
 FOR i IN 1 .. jsonb_array_length(input_data->'eobj'->'edetails') -1 LOOP
        edetail := input_data->'eobj'->'edetails'->i;
        bank_name := edetail->>'bank_name';

		----unique name
		IF bank_name = ANY(input_bank_names) THEN   --- checks for each bank name in the input by itself if duplicate found returns error
            RETURN FALSE;  
        ELSE
            input_bank_names := array_append(input_bank_names, bank_name); 
        END IF;

		IF EXISTS (SELECT 1 FROM dmsr.banks WHERE bname = bank_name) THEN
    		RETURN FALSE;
		END IF;
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION dmsr.bank_validator_writer(context varchar,input_data JSONB) 
RETURNS JSON AS $$
DECLARE
    values_list TEXT := '';
    insert_query TEXT;
    i INT;
	rows_count INT := 0;

    eid INTEGER := (input_data->>'eid')::INTEGER;
    eby INTEGER := (input_data->'eobj'->>'event_by')::INTEGER;
    bevts VARCHAR := 'BANK_ONBOARDED';

    edetail JSONB;
    bank_name VARCHAR;
    bank_address VARCHAR;
    binfo JSONB;
BEGIN
 IF context = 'INSERT' THEN
    IF NOT dmsr.bank_validator(input_data) THEN
        RETURN jsonb_build_object('status', 'FAILURE', 'rows_inserted', 0);
    END IF;

    FOR i IN 1 .. jsonb_array_length(input_data->'eobj'->'edetails') -1 LOOP
        edetail := input_data->'eobj'->'edetails'->i;
        bank_name := edetail->>'bank_name';
        bank_address := edetail->>'baddr';
        binfo := edetail->'binfo';

        values_list := values_list || '(' ||
                       quote_literal(eid) || ', ' ||
                       quote_literal(bevts) || ', ' ||
                       quote_literal(eby) || ', ' ||
                       quote_literal(bank_name) || ', ' ||
                       quote_literal(bank_address) || ', ' ||
                       quote_literal(binfo) || '), ';
		rows_count := rows_count + 1;
    END LOOP;

    IF length(values_list) > 0 THEN
        values_list := left(values_list, length(values_list) - 2);
        insert_query := 'INSERT INTO dmsr.banks (eid, bevt, eby, bname, baddr, binfo) VALUES ' || values_list ||';' ;

        EXECUTE insert_query;

        RETURN jsonb_build_object('status', 'SUCCESS', 'rows_inserted', rows_count);
    ELSE
        RETURN jsonb_build_object('status', 'FAILURE', 'rows_inserted', 0);
    END IF;
 ELSE
        RETURN jsonb_build_object('status', 'FAILURE', 'message', 'Invalid context provided');
 END IF;
END;
$$ LANGUAGE plpgsql;


DROP FUNCTION dmsr.bank_validator_writer(jsonb)
SELECT dmsr.bank_validator_writer('INSERT',
    '{
        "aid": 3,
        "alid": 28,
        "eid": 28,
        "ecode": "BANK_ONBOARDED",
        "eobj": {
            "event": "BANK_ONBOARDED",
            "event_by": 1,
            "edetails": [
                {
                    "bank_name": "aaaaaaaaaa",
                    "baddr": "1st Main Road",
                    "binfo": {
                        "name": "sbi",
                        "designation": "manager",
                        "phno": "+919876543211",
                        "email": "xyz@gmail.com"
                    }
                },
                {
                    "bank_name": "aswd",
                    "baddr": "1st Main Road",
                    "binfo": {
                        "name": "aaa",
                        "designation": "manager",
                        "phno": "+919876543211",
                        "email": "xyz@gmail.com"
                    }
                }
            ]
        }
    }'::jsonb
);



truncate dmsr.banks_v
DROP FUNCTION dmsr.bank_validator_writer(jsonb)










-----------------------------------------------------------------------------------------------------------------
---------------------------------------------------ONBOARD MANUFACTURE---------------------------------------------------------------
-----------------------------------------------------------------------------------------------------------------





CREATE OR REPLACE FUNCTION dmsr.mf_validator(input_data JSONB) 
RETURNS BOOLEAN AS $$
DECLARE

    edetails JSONB;
    i INT;
    edetail JSONB;
    mf_name VARCHAR;
	input_mf_names TEXT[] := '{}';
BEGIN

 FOR i IN 0 .. jsonb_array_length(input_data->'eobj'->'edetails') - 1 LOOP
        edetail := input_data->'eobj'->'edetails'->i;
        mf_name := edetail->>'mfname';
		
		----unique name
		IF mf_name = ANY(input_mf_names) THEN   --- checks for each mf name in the input by itself if duplicate found returns error
            RETURN FALSE;  
        ELSE
            input_mf_names := array_append(input_mf_names, mf_name); 
        END IF;

        IF EXISTS (SELECT 1 FROM dmsr.mf WHERE mfname = mf_name ) THEN
            RETURN FALSE;
        END IF;
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION dmsr.mf_validator_writer(context varchar,input_data JSONB) 
RETURNS JSON AS $$
DECLARE
    values_list TEXT := '';
    insert_query TEXT;
    i INT;
	rows_count INT := 0;

    eid INTEGER := (input_data->>'eid')::INTEGER;
    eby INTEGER := (input_data->'eobj'->>'event_by')::INTEGER;
    mfevts VARCHAR := 'MF_ONBOARDED';
   
    edetail JSONB;
    mf_name VARCHAR;
    mf_address VARCHAR;
    mfinfo JSONB;
BEGIN
 IF context = 'INSERT' THEN

    IF NOT dmsr.mf_validator(input_data) THEN
        RETURN jsonb_build_object('status', 'FAILURE', 'rows_inserted', 0);
    END IF;

    FOR i IN 0 .. jsonb_array_length(input_data->'eobj'->'edetails') - 1 LOOP
        edetail := input_data->'eobj'->'edetails'->i;
        mf_name := edetail->>'mfname';
        mf_address := edetail->>'mfaddr';
        mfinfo := edetail->'mfinfo';

        values_list := values_list || '(' ||
                       quote_literal(eid) || ', ' ||
                       quote_literal(mfevts) || ', ' ||
                       quote_literal(eby) || ', ' ||
                       quote_literal(mf_name) || ', ' ||
                       quote_literal(mf_address) || ', ' ||
                       quote_literal(mfinfo) || '), ';
		rows_count := rows_count + 1;
    END LOOP;

    IF length(values_list) > 0 THEN
        values_list := left(values_list, length(values_list) - 2);
        insert_query := 'INSERT INTO dmsr.mf (eid, mfevt, eby, mfname, mfaddr, mfinfo) VALUES ' || values_list ||';' ;

        EXECUTE insert_query;

        RETURN jsonb_build_object('status', 'SUCCESS', 'rows_inserted', rows_count);
    ELSE
        RETURN jsonb_build_object('status', 'FAILURE', 'rows_inserted', 0);
    END IF;
 ELSE
        RETURN jsonb_build_object('status', 'FAILURE', 'message', 'Invalid context provided');
 END IF;
END;
$$ LANGUAGE plpgsql;




SELECT dmsr.mf_validator_writer('INSERT',
'{
  "aid": 3,
  "alid": 28,
  "eid": 28,
  "ecode": "ONBOARD_MANUFACTURER",
  "eobj": {
    "event": "ONBOARD_MANUFACTURER",
    "event_by": 1,
    "edetails": [
      {
        "mfname": "manufacturer8",
        "mfaddr": "2nd Main Road",
        "mfinfo": {
          "name": "abc",
          "ph_no": "+91987654321",
          "email": "abc@gmail.com"
        }
      },
      {
        "mfname": "manufacturer9",
        "mfaddr": "3rd Main Road",
        "mfinfo": {
          "name": "cdc",
          "ph_no": "+91337654321",
          "email": "arjc@gmail.com"
        }
		}
      ]
    }
  }'::jsonb 
);





-----------------------------------------------------------------------------------------------------------------
---------------------------------------------------ONBOARD BRANCHES---------------------------------------------------------------
-----------------------------------------------------------------------------------------------------------------




CREATE OR REPLACE FUNCTION dmsr.branches_validator(input_data JSONB) 
RETURNS BOOLEAN AS $$
DECLARE
    edetail JSONB;
    i INT;
    br_name VARCHAR;
    b_id INTEGER;
    input_br_names TEXT[] := '{}';
BEGIN

    FOR i IN 0 .. jsonb_array_length(input_data->'eobj'->'edetails') - 1 LOOP
        edetail := input_data->'eobj'->'edetails'->i;
        br_name := edetail->>'brname';
        b_id := (edetail->>'bank_id')::INTEGER;



        IF br_name = ANY(input_br_names) THEN
            RETURN FALSE; 
        ELSE
            input_br_names := array_append(input_br_names, br_name); 
        END IF;

		IF EXISTS (SELECT 1 FROM dmsr.branches WHERE brname = br_name) THEN
    		RETURN FALSE;
		END IF;

		IF NOT EXISTS (SELECT 1 FROM dmsr.banks WHERE bid = b_id AND isd = 'false') THEN
    		RETURN FALSE;
		END IF;
        
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION dmsr.branches_validator_writer(context varchar,input_data JSONB) 
RETURNS JSON AS $$
DECLARE
    values_list TEXT := '';
    insert_query TEXT;
    i INT;
	rows_count INT := 0;

    eid INTEGER := (input_data->>'eid')::INTEGER;
    eby INTEGER := (input_data->'eobj'->>'event_by')::INTEGER;
    brevts VARCHAR := 'BRANCH_ONBOARDED';
   
    edetail JSONB;
    br_name VARCHAR;
    br_address VARCHAR;
    brinfo JSONB;
	bid INTEGER;
BEGIN
 IF context = 'INSERT' THEN

    IF NOT dmsr.branches_validator(input_data) THEN
        RETURN jsonb_build_object('status', 'FAILURE', 'rows_inserted', 0);
    END IF;

    FOR i IN 0 .. jsonb_array_length(input_data->'eobj'->'edetails') - 1 LOOP
        edetail := input_data->'eobj'->'edetails'->i;
        br_name := edetail->>'brname';
        br_address := edetail->>'braddr';
        brinfo := edetail->'brinfo';
		bid := edetail->'bank_id';

        values_list := values_list || '(' ||
                       quote_literal(eid) || ', ' ||
                       quote_literal(brevts) || ', ' ||
                       quote_literal(eby) || ', ' ||
					   quote_literal(bid) || ', ' ||
                       quote_literal(br_name) || ', ' ||
                       quote_literal(br_address) || ', ' ||
                       quote_literal(brinfo) || '), ';
		rows_count := rows_count + 1;
    END LOOP;

    IF length(values_list) > 0 THEN
        values_list := left(values_list, length(values_list) - 2);
        insert_query := 'INSERT INTO dmsr.branches (eid, brevt, eby, bid, brname, braddr, brinfo) VALUES ' || values_list ||';' ;

        EXECUTE insert_query;

        RETURN jsonb_build_object('status', 'SUCCESS', 'rows_inserted', rows_count);
    ELSE
        RETURN jsonb_build_object('status', 'FAILURE', 'rows_inserted', 0);
    END IF;
 ELSE
        RETURN jsonb_build_object('status', 'FAILURE', 'message', 'Invalid context provided');
 END IF;
END;
$$ LANGUAGE plpgsql;




SELECT dmsr.branches_validator_writer('INSERT',
'{
  "aid": 3,
  "alid": 28,
  "eid": 28,
  "ecode": "ONBOARD_BRANCH",
  "eobj": {
    "event": "ONBOARD_BRANCH",
    "event_by": 1,
    "edetails": [
      {
	  	"bank_id": 160,
        "brname": "branch1",
        "braddr": "2nd Main Road",
        "brinfo": {
          "name": "abc",
          "ph_no": "+91987654321",
          "email": "abc@gmail.com"
        }
      },
      {
	    "bank_id": 160,
        "brname": "branch2",
        "braddr": "3rd Main Road",
        "brinfo": {
          "name": "cdc",
          "ph_no": "+91337654321",
          "email": "arjc@gmail.com"
        }
		}
      ]
    }
  }'::jsonb 
);



-----------------------------------------------------------------------------------------------------------------
---------------------------------------------------ONBOARD DEVICES---------------------------------------------------------------
-----------------------------------------------------------------------------------------------------------------


CREATE OR REPLACE FUNCTION dmsr.devices_validator(input_data JSONB) 
RETURNS BOOLEAN AS $$
DECLARE

    i INT;
    edetail JSONB;
    d_name VARCHAR;
	mf_id INTEGER;
	model_id INTEGER;
	firmware_id INTEGER;
	input_d_names TEXT[] := '{}';
BEGIN	
    FOR i IN 0 .. jsonb_array_length(input_data->'eobj'->'edetails') - 1 LOOP
        edetail := input_data->'eobj'->'edetails'->i;
        d_name := edetail->>'dname';
		mf_id := edetail->>'mfid';
		model_id :=edetail->>'model_id';
		firmware_id :=edetail->>'firmware_id';

		----unique name
		IF d_name = ANY(input_d_names) THEN   --- checks for each devices name in the input by itself if duplicate found returns error
            RETURN FALSE;  
        ELSE
            input_d_names := array_append(input_d_names, d_name); 
        END IF;

		IF EXISTS (SELECT 1 FROM dmsr.devices WHERE dname = d_name) THEN
    		RETURN FALSE;
		END IF;

		IF NOT EXISTS (SELECT 1 FROM dmsr.mf WHERE mfid = mf_id) THEN
    		RETURN FALSE;
		END IF;

		IF NOT EXISTS (SELECT 1 FROM dmsr.model WHERE mdid = model_id) THEN
    		RETURN FALSE;
		END IF;

		IF NOT EXISTS (SELECT 1 FROM dmsr.firmware WHERE fid = firmware_id) THEN
    		RETURN FALSE;
		END IF;
		
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION dmsr.devices_validator_writer(context varchar,input_data JSONB) 
RETURNS JSON AS $$
DECLARE
    values_list TEXT := '';
    insert_query TEXT;
    i INT;
	rows_count INT := 0;
	
    eid INTEGER := (input_data->>'eid')::INTEGER;
    eby INTEGER := (input_data->'eobj'->>'event_by')::INTEGER;
    devts VARCHAR := 'DEVICE_ONBOARDED';
   
    edetail JSONB;
    d_name VARCHAR;
	mfid INTEGER;
	model_id INTEGER;
	firmware_id INTEGER;
BEGIN
 IF context = 'INSERT' THEN

    IF NOT dmsr.devices_validator(input_data) THEN
        RETURN jsonb_build_object('status', 'FAILURE', 'rows_inserted', 0);
    END IF;

    FOR i IN 0 .. jsonb_array_length(input_data->'eobj'->'edetails') - 1 LOOP
        edetail := input_data->'eobj'->'edetails'->i;
        d_name := edetail->>'dname';
        mfid := edetail->>'mfid';
        model_id := edetail->'model_id';
		firmware_id := edetail->'firmware_id';

        values_list := values_list || '(' ||
                       quote_literal(eid) || ', ' ||
                       quote_literal(devts) || ', ' ||
                       quote_literal(eby) || ', ' ||
					   quote_literal(d_name) || ', ' ||
                       quote_literal(mfid) || ', ' ||
                       quote_literal(model_id) || ', ' ||
                       quote_literal(firmware_id) || '), ';
		rows_count := rows_count + 1;
    END LOOP;

    IF length(values_list) > 0 THEN
        values_list := left(values_list, length(values_list) - 2);
        insert_query := 'INSERT INTO dmsr.devices (eid, devt, eby, dname, mfid, mdid, fid) VALUES ' || values_list ||';' ;

        EXECUTE insert_query;

        RETURN jsonb_build_object('status', 'SUCCESS', 'rows_inserted', rows_count);
    ELSE
        RETURN jsonb_build_object('status', 'FAILURE', 'rows_insertedss', 0);
    END IF;
 ELSE
        RETURN jsonb_build_object('status', 'FAILURE', 'message', 'Invalid context provided');
 END IF;
END;
$$ LANGUAGE plpgsql;

EXPLAIN ANALYZE
SELECT dmsr.devices_validator_writer('INSERT',
'{
  "aid": 3,
  "alid": 28,
  "eid": 28,
  "ecode": "ONBOARD_DEVICE",
  "eobj": {
    "event": "ONBOARD_DEVICE",
    "event_by": 1,
    "edetails": [
      {
        "mfid": 67,
        "model_id": 1,
        "firmware_id": 65432,
        "dname": "12"
      },
      {
        "mfid": 65,
        "model_id": 1,
        "firmware_id": 11,
        "dname": "1234567"
      }
    ]
  }
}'::jsonb 
);

