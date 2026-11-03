-------------------------------------------------------------------------------------------------------------------------------
--------------------------------------------------BANKS--------------------------------------------------
-------------------------------------------------------------------------------------------------------------------------------
ALTER TABLE registry.banks ADD COLUMN logo VARCHAR; 

DROP FUNCTION IF EXISTS registry.bank_validator_writer,registry.bank_iterator;

CREATE OR REPLACE FUNCTION registry.bank_validator_writer(
    rowid INTEGER,
	b_id INTEGER,	
    b_name VARCHAR,
    b_addr VARCHAR,
    b_info jsonb,
    e_by VARCHAR,
    e_id INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.banks_msgs[],bank_name VARCHAR,bank_id INTEGER) AS $$
DECLARE
    bank_name VARCHAR := NULL;
	bank_id INTEGER := NULL;
    bevt registry.bevts := 'BANK_ONBOARDED';
	validator_result registry.banks_msgs[];
BEGIN
	
	validator_result :=  registry.bank_validator(b_name,b_id,b_addr,b_info);
	   
    IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,bank_name,bank_id;
		RETURN;
	END IF;

	CASE 
		WHEN b_id IS NULL THEN
    		INSERT INTO registry.banks (bname, baddr, bevt, binfo, eby, eid)
    		VALUES (b_name, b_addr, bevt, b_info, e_by, e_id)
   			RETURNING bname,bid INTO bank_name,bank_id ;
   			RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_INSERT']::registry.banks_msgs[],bank_name,bank_id;
				
		WHEN b_id IS NOT NULL THEN 
    		UPDATE registry.banks
       		SET 
           		baddr = COALESCE(b_addr, baddr),
            	binfo = COALESCE(NULLIF(b_info::text, '{}'::text)::json, binfo),
				eby = e_by,
				eid = e_id,
				eat = CURRENT_TIMESTAMP
       		WHERE bid = b_id
			RETURNING bname,bid INTO bank_name,bank_id;
       		RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_UPDATE']::registry.banks_msgs[], bank_name,bank_id;

	END CASE;


END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.bank_iterator(
	rowid INT[],
	bank_id INT[],
    bank_names TEXT[],
    bank_addrs TEXT[],
    binfo_list JSONB[],
    event_bys TEXT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.banks_msgs[],bank_name VARCHAR,bid INT) AS $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(rowid, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.bank_validator_writer(
			rowid[i],
			COALESCE(bank_id[i], NULL) ,
            bank_names[i],
            COALESCE(NULLIF(bank_addrs[i], ''), NULL),
            COALESCE(binfo_list[i],'{}'::jsonb), 
            event_bys[i], 
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;



-------------------------------------------------------------------------------------------------------------------------------
----------------------------------------------BRANCHES-------------------------------------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------------------------


DROP FUNCTION IF EXISTS registry.branch_validator_writer;
DROP FUNCTION IF EXISTS registry.branch_iterator;



CREATE OR REPLACE FUNCTION registry.branch_validator_writer(
    rowid INTEGER,
	br_id INTEGER,
	b_name VARCHAR,
    br_name VARCHAR,
    br_addr VARCHAR,
    br_info jsonb,
    e_by VARCHAR,
    e_id INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.branches_msgs[],br_names VARCHAR,branch_id INTEGER,bank_id INTEGER) AS $$
DECLARE
    b_id INTEGER := NULL;
	branch_id INTEGER :=NULL;
    br_evt registry.brevts := 'BRANCH_ONBOARDED';
    branch_name VARCHAR := NULL;
	validator_result registry.branches_msgs[];
BEGIN

    SELECT bid INTO b_id FROM registry.banks WHERE bname = b_name;

	validator_result := registry.branch_validator(br_name,b_id,br_id,br_addr,br_info);

    IF array_length(validator_result, 1) > 0 THEN
	    RETURN QUERY SELECT rowid,0,validator_result,branch_name,branch_id,b_id;
	    RETURN;
	END IF;
	CASE
		WHEN br_id IS NULL THEN
   			INSERT INTO registry.branches (brname,bid, braddr, brevt, brinfo, eby, eid)
    		VALUES (br_name,b_id, br_addr, br_evt, br_info, e_by, e_id)
   		 	RETURNING brname,brid INTO branch_name,branch_id;
   		 	RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_INSERT']::registry.branches_msgs[],branch_name,branch_id,b_id;
				
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
       		RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_UPDATE']::registry.branches_msgs[], branch_name,br_id,b_id;

	END CASE;    

END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.branch_iterator(
	rowid INT[],
	br_id INT[],
	bank_names TEXT[],
    br_names TEXT[],
    br_addrs TEXT[],
    brinfo_list JSONB[],
    event_bys TEXT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.branches_msgs[],branch_name VARCHAR,brid INT,bid INT) AS $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(rowid, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.branch_validator_writer(
			rowid[i],
			COALESCE(br_id[i],NULL),
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




-------------------------------------------------------------------------------------------------------------------------------
--------------------------------------------MERCHANTS
-------------------------------------------------------------------------------------------------------------------------------


DROP FUNCTION IF EXISTS registry.merchant_validator_writer;
DROP FUNCTION IF EXISTS registry.merchant_iterator;


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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.merchants_msgs[],merchant_name VARCHAR,branch_id INTEGER,bank_id INTEGER) AS $$
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
		RETURN QUERY SELECT rowid,0,validator_result,merchant_name,br_id,b_id;
		RETURN;
	END IF;

	CASE 
		WHEN mp_id IS NULL THEN
    		INSERT INTO registry.merchants (eid, mevt, eby, mname,bid,brid,minfo,msid,maddr,mtid)
    		VALUES (e_id, m_evt, e_by, m_name,b_id,br_id,m_info,ms_id,m_addr,mt_id)
			RETURNING mname INTO merchant_name;
			RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_INSERT']::registry.merchants_msgs[],merchant_name,br_id,b_id;
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
       		RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_UPDATE']::registry.merchants_msgs[], merchant_name,br_id,b_id;

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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.merchants_msgs[],merchant_name VARCHAR,brid INTEGER,bid INTEGER) AS
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



-------------------------------------------------------------------------------------------------------------------------------
---------------------------------------DEVICES ISSUES ---------------------
-------------------------------------------------------------------------------------------------------------------------------

DROP FUNCTION IF EXISTS registry.raise_device_issues;



CREATE OR REPLACE FUNCTION registry.raise_device_issues(
	rowid INTEGER,
	device_issue_id INTEGER,
	context VARCHAR,
    d_name VARCHAR,
	b_name VARCHAR,
	b_id INTEGER,
	br_name VARCHAR,
	v_name VARCHAR,
	m_name VARCHAR,
	m_phno VARCHAR ,
	di_status registry.di_status,
	d_issue TEXT,
	e_by VARCHAR,
	e_id INTEGER
	
	
)
RETURNS TABLE (
	row_id INTEGER,
	msg TEXT,
	iid INTEGER,
	deviceId VARCHAR,
	vpaId VARCHAR,
	merchantName VARCHAR,
	merchantphno VARCHAR ,
	action_status registry.di_status,
	issue TEXT,
	eventID INTEGER,
	bid INTEGER,
	brid INTEGER,
	status INTEGER
	
	

) AS $$
DECLARE
	deviceissue_id INTEGER;
	devices_name VARCHAR;
    vpa_name VARCHAR;
    merchants_name VARCHAR;
	merchant_phno VARCHAR;
	issue_status registry.di_status;
	issue_description TEXT;
	event_id INTEGER;
	branch_id INTEGER;
	bank_id INTEGER;
	branch_name VARCHAR;
	
BEGIN

	IF context = 'CREATE' THEN
		INSERT INTO registry.device_issues AS di(dname,bname,brname,vpa,mname,mphno,status,issue_desc,eby,eid,bid)  --added bid
		VALUES (d_name,b_name,br_name,v_name,m_name,m_phno,di_status,d_issue,e_by,e_id,b_id)							 -- added b_id
		RETURNING di.iid INTO deviceissue_id;
		SELECT br.brid INTO branch_id FROM registry.branches br WHERE br.brname = br_name;
		RETURN QUERY SELECT 1,'ISSUE_CREATED',deviceissue_id,d_name,v_name,m_name,m_phno,di_status,d_issue,e_id,b_id,branch_id,1;

	
	ELSIF context = 'UPDATE' THEN
	  IF EXISTS(SELECT 1 FROM registry.device_issues AS di WHERE di.iid = device_issue_id ) THEN
		UPDATE registry.device_issues AS di
			SET
				status = di_status,
				eby = e_by,
				eid = e_id
			WHERE di.iid = device_issue_id
		RETURNING dname,vpa,mname,mphno,di.status,issue_desc,eid,di.brname,di.bid INTO devices_name,vpa_name,merchants_name,merchant_phno,issue_status,issue_description,event_id,branch_name,bank_id;

		SELECT br.brid INTO branch_id br FROM registry.branches br WHERE brname = branch_name;
		
		RETURN QUERY SELECT 1,'ISSUE_UPDATED',device_issue_id,devices_name,vpa_name,merchants_name,merchant_phno,issue_status,issue_description,event_id,bank_id,branch_id,1;
	  ELSE 
	  	RETURN QUERY SELECT 1,'INVALID_IID',device_issue_id,devices_name,vpa_name,merchants_name,merchant_phno,issue_status,issue_description,event_id,bank_id,branch_id,0;
	  END IF;
	END IF;
		

END;
$$ LANGUAGE plpgsql;

-------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------DEVICE REQUESTS------------------
-------------------------------------------------------------------------------------------------------------------------------



DROP FUNCTION IF EXISTS registry.device_request_validator_writer;

CREATE OR REPLACE FUNCTION registry.device_request_validator_writer(
    rowid INTEGER,
    device_request_id INTEGER,
    context VARCHAR,
    b_name VARCHAR,
    b_id INTEGER,
    br_name VARCHAR,
    m_name VARCHAR,
    dr_status registry.dr_status,
    s_provider VARCHAR,
    d_quantity INTEGER,
    e_by VARCHAR,
    e_id INTEGER
)
RETURNS TABLE (
    row_id INTEGER,
    msg TEXT,
    dr_id INTEGER,
    bankName VARCHAR,
    branchName VARCHAR,
    merchantName VARCHAR,
    merchantInfo JSON,
    action_status registry.dr_status,
    eventID INTEGER,
    simProvider VARCHAR,
    deviceQuantity INTEGER,
    merchantType VARCHAR,
    eventBY VARCHAR,
	bid INTEGER,
	brid INTEGER,
	status INTEGER
) AS $$
DECLARE
    devicerequest_id INTEGER;
    banks_name VARCHAR;
    branches_name VARCHAR;
    merchants_name VARCHAR;
    merchant_info JSON;
    request_status registry.dr_status;
    event_id INTEGER;
    event_by VARCHAR;
    simprovider VARCHAR;
    devicequantity INTEGER;
    merchanttype VARCHAR;
	branch_id INTEGER;
	bank_id INTEGER;
BEGIN
    -- Handle CREATE context
    IF context = 'CREATE' THEN
		select br.brid INTO branch_id FROM registry.branches br WHERE br.brname = br_name;

		SELECT minfo INTO merchant_info FROM registry.merchants WHERE mname = m_name;
    	SELECT merchant_type INTO merchanttype FROM registry.merchant_types WHERE mtid = (SELECT mtid FROM registry.merchants WHERE mname = m_name);

        -- Insert new device request and return values
        INSERT INTO registry.device_requests AS dr(bname, brname, mname, minfo, status, eby, eid, bid, sim_provider, device_quantity, merchant_type)
        VALUES (b_name, br_name, m_name, merchant_info, dr_status, e_by, e_id, b_id, s_provider, d_quantity, merchanttype)
        RETURNING drid, bname, brname, mname, minfo, dr.status, eid, eby, sim_provider, device_quantity, merchant_type
        INTO devicerequest_id, banks_name, branches_name, merchants_name, merchant_info, request_status, event_id, event_by, simprovider, devicequantity, merchanttype;

        -- Return the result as a query
        RETURN QUERY SELECT rowid, 'REQUEST_CREATED', devicerequest_id, banks_name, branches_name, merchants_name, merchant_info, request_status, event_id, simprovider, devicequantity, merchanttype, event_by,b_id,branch_id,1;

    -- Handle UPDATE context
    ELSIF context = 'UPDATE' THEN
        IF EXISTS(SELECT 1 FROM registry.device_requests AS dr WHERE dr.drid = device_request_id) THEN
            -- Update existing device request and return values
            UPDATE registry.device_requests AS dr
            SET status = dr_status, eby = e_by, eid = e_id
            WHERE dr.drid = device_request_id
            RETURNING bname, brname, mname, minfo, dr.status, eid, eby, sim_provider, device_quantity, merchant_type,dr.bid
            INTO banks_name, branches_name, merchants_name, merchant_info, request_status, event_id, event_by, simprovider, devicequantity, merchanttype,bank_id;

			SELECT br.brid INTO branch_id FROM registry.branches br WHERE brname = branches_name; 
			
            -- Return the updated result as a query
            RETURN QUERY SELECT rowid, 'REQUEST_UPDATED', device_request_id, banks_name, branches_name, merchants_name, merchant_info, request_status, event_id, simprovider, devicequantity, merchanttype, event_by,bank_id,branch_id,1;
        ELSE
            -- Return error if device request ID doesn't exist
            RETURN QUERY SELECT rowid, 'INVALID_DRID', device_request_id, banks_name, branches_name, merchants_name, merchant_info, request_status, event_id, simprovider, devicequantity, merchanttype, event_by,bank_id,branch_id,0;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS registry.device_request_iterator;


CREATE OR REPLACE FUNCTION registry.device_request_iterator(
	rowid INT[],
	drid INT[],
	context TEXT[],
    b_name TEXT[],
	b_id INT[],
	br_name TEXT[] ,
	m_name TEXT[],
    s_provider TEXT[],
    d_quantity INT[],
	dr_status TEXT[],
	event_bys TEXT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER,
    msg TEXT,
    dr_id INTEGER,
    bankname VARCHAR,
    branchname VARCHAR,
    merchantname VARCHAR,
    merchantinfo JSON,
	action_status registry.dr_status,
    eventid INTEGER,
    simprovider VARCHAR,
    devicequantity INTEGER,
    merchanttype VARCHAR,
    eventby VARCHAR,
	bid INTEGER,
	brid INTEGER,
	status INTEGER
)  AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(rowid, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.device_request_validator_writer(
			rowid[i],
			drid [i],
			context[i],
			b_name[i],
			b_id[i],
			br_name[i],
			m_name[i],
			dr_status[i]::registry.dr_status,
			s_provider[i] ,
   			d_quantity[i],
    		event_bys[i],   
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;





-------------------------------------------------------------------------------------------------------------------------------
--------------------------------------------SB FUNCTIONS ------------------------------
-------------------------------------------------------------------------------------------------------------------------------


DROP FUNCTION IF EXISTS registry.sb_validator_writer;
DROP FUNCTION IF EXISTS registry.sb_iterator;



CREATE OR REPLACE FUNCTION registry.sb_validator_writer(
    rowid INTEGER,
    evt VARCHAR,
    _vpa VARCHAR,    
    _dname VARCHAR,
    _bname VARCHAR,
    _brname VARCHAR,
    _mname VARCHAR,
    e_by VARCHAR,
    e_id INTEGER
)
RETURNS TABLE (
    row_id INTEGER, 
    status INTEGER, 
    msgs registry.sb_msgs[], 
    id_headers TEXT[], 
    id_values VARCHAR[], 
    e_at TIMESTAMP,
	b_id INTEGER,
	br_id INTEGER,
	last_action registry.sbevts
) AS $$
DECLARE
    v_id INTEGER;
    d_id INTEGER;
    b_id INTEGER;
    br_id INTEGER;
    mp_id INTEGER;
    validator_result registry.sb_msgs[];
    id_values RECORD;
	result_values RECORD;
    headers_array TEXT[] := ARRAY[ 'device_id','vpa_id', 'bank_id', 'branch_id', 'merchant_id']; 
	branch_id INTEGER;
	bank_id INTEGER;
	last_action registry.sbevts;

BEGIN
	SELECT vid INTO v_id FROM registry.vpa WHERE vpa = _vpa ;
	SELECT did INTO d_id FROM registry.devices WHERE dname = _dname ;
    SELECT bid INTO b_id FROM registry.banks WHERE bname = _bname ;
    SELECT brid INTO br_id FROM registry.branches WHERE brname = _brname ;
    SELECT mpid INTO mp_id FROM registry.merchants WHERE mname = _mname ;
	SELECT sbevt INTO last_action FROM registry.sb WHERE did = d_id ;
	SELECT sb.bid INTO bank_id FROM registry.sb WHERE sb.did = d_id;
	SELECT sb.brid INTO branch_id FROM registry.sb WHERE sb.did = d_id;

    validator_result := registry.sb_validator(evt, v_id, d_id, b_id, br_id, mp_id);

    IF array_length(validator_result, 1) > 0 THEN
        RETURN QUERY SELECT rowid, 0, validator_result, ARRAY[]::text[], ARRAY[]::varchar[], NULL::timestamp,b_id,br_id,last_action; 
   		RETURN; 
	END IF;

    CASE
        WHEN evt = 'BIND_DEVICE' THEN
            UPDATE registry.sb
            SET 
                sbevt = 'VPA_DEVICE_BIND',
                vid = v_id,
                eby = e_by,
				eid = e_id,
                eat = CURRENT_TIMESTAMP
            WHERE did = d_id AND isd = FALSE
            RETURNING sid, vid, did, bid, brid, mid, eat INTO id_values;

        WHEN evt = 'UNBIND_DEVICE' THEN
            UPDATE registry.sb
            SET 
                sbevt = 'VPA_DEVICE_UNBIND',
                vid = null,
                eby = e_by,
				eid = e_id,
                eat = CURRENT_TIMESTAMP
            WHERE did = d_id AND isd = FALSE
            RETURNING sid, vid, did, bid, brid, mid, eat INTO id_values;

        WHEN evt = 'ALLOCATE_TO_BANK' THEN
            UPDATE registry.sb
            SET 
                sbevt = 'ALLOCATED_TO_BANK',
                bid = b_id,
                eby = e_by,
				eid = e_id,
                eat = CURRENT_TIMESTAMP
            WHERE did = d_id AND isd = FALSE
            RETURNING sid, vid, did, bid, brid, mid, eat INTO id_values;

        WHEN evt = 'ALLOCATE_TO_BRANCH' THEN
            UPDATE registry.sb
            SET 
                sbevt = 'ALLOCATED_TO_BRANCH',
                brid = br_id,
                eby = e_by,
				eid = e_id,
                eat = CURRENT_TIMESTAMP
            WHERE did = d_id AND isd = FALSE
            RETURNING sid, vid, did, bid, brid, mid, eat INTO id_values;

        WHEN evt = 'ALLOCATE_TO_MERCHANT' THEN
            UPDATE registry.sb
            SET 
                sbevt = 'ALLOCATED_TO_MERCHANT',
                mid = mp_id,
                eby = e_by,
				eid = e_id,
                eat = CURRENT_TIMESTAMP
            WHERE did = d_id AND isd = FALSE
            RETURNING sid, vid, did, bid, brid, mid, eat INTO id_values;


---------------------------DEACTIVATE----------------------------


		WHEN evt='DEACTIVATE_DEVICE' THEN
				UPDATE registry.devices
				SET
					devt = 'DEVICE_DEACTIVATED',
					isa = false,
					eby = e_by,
					eid = e_id,
                    eat = CURRENT_TIMESTAMP
				WHERE did = d_id;
                UPDATE registry.sb
                SET 
                    sbevt = 'DEVICE_DEACTIVATED',
                    isa = false,	
                    eby = e_by,
					eid = e_id,
                    eat = CURRENT_TIMESTAMP
                WHERE did = d_id AND isd = FALSE;			


		WHEN evt='DEACTIVATE_BRANCH' THEN
				UPDATE registry.branches
				SET
					brevt = 'BRANCH_DEACTIVATED',
					isa = false,
					eby = e_by,
					eid = e_id,
                    eat = CURRENT_TIMESTAMP
				WHERE brid = br_id;
                UPDATE registry.sb
                SET 
                    sbevt = 'BRANCH_DEACTIVATED',
                    eby = e_by,
					eid = e_id,
                    eat = CURRENT_TIMESTAMP
                WHERE brid = br_id AND isd = FALSE	;			
				
		WHEN evt='DEACTIVATE_VPA' THEN
				UPDATE registry.vpa
				SET
					vevt = 'VPA_DEACTIVATED',
					isa = false,
					eby = e_by,
					eid = e_id,
                    eat = CURRENT_TIMESTAMP
				WHERE vid = v_id;
                UPDATE registry.sb
                SET 
                    sbevt = 'VPA_DEACTIVATED',
                    eby = e_by,
					eid = e_id,
                    eat = CURRENT_TIMESTAMP
                WHERE vid = v_id AND isd = FALSE;
				
		WHEN evt='DEACTIVATE_MERCHANT' THEN
				UPDATE registry.merchants
				SET
					mevt = 'MERCHANT_DEACTIVATED',
					isa = false,
					eby = e_by,
					eid = e_id,
                    eat = CURRENT_TIMESTAMP
				WHERE mpid = mp_id;
                UPDATE registry.sb
                SET 
                    sbevt = 'MERCHANT_DEACTIVATED',
                    eby = e_by,
					eid = e_id,
                    eat = CURRENT_TIMESTAMP
                WHERE mid = mp_id AND isd = FALSE	;			
                
        WHEN evt='DEACTIVATE_BANK' THEN
                UPDATE registry.banks
                SET
                    bevt = 'BANK_DEACTIVATED',
                    isa = false,
                    eby = e_by,
					eid = e_id,
                    eat = CURRENT_TIMESTAMP
                WHERE bid = b_id;    
                UPDATE registry.sb                
                SET 
                    sbevt = 'BANK_DEACTIVATED',
                    eby = e_by,
					eid = e_id,
                    eat = CURRENT_TIMESTAMP
                WHERE bid = b_id AND isd = FALSE;

		WHEN evt='DELETE_VPA' THEN
				UPDATE registry.vpa
				SET
					vevt = 'VPA_DELETED',
					isd = true,
					isa = false,
					eby = e_by,
					eid = e_id,
                    eat = CURRENT_TIMESTAMP
				WHERE vid = v_id;
                UPDATE registry.sb
                SET 
                    sbevt = 'VPA_DELETED',
                    eby = e_by,
					eid = e_id,
                    eat = CURRENT_TIMESTAMP
                WHERE vid = v_id AND isd = FALSE;

        WHEN evt='REALLOCATE_TO_MERCHANT' THEN
				UPDATE registry.sb
       			SET 
           			sbevt = 'REALLOCATED_TO_MERCHANT', 
                    mid = mp_id,
					eby = e_by,
					eid = e_id,
					eat = CURRENT_TIMESTAMP
       			WHERE did = d_id AND isd = FALSE
            	RETURNING sid, vid, did, bid, brid, mid, eat INTO id_values;


		WHEN evt='REALLOCATE_TO_BRANCH' THEN
				UPDATE registry.sb
       			SET 
           			sbevt = 'REALLOCATED_TO_BRANCH', 
                    mid = NULL,
					brid = br_id,
					eby = e_by,
					eid = e_id,
					eat = CURRENT_TIMESTAMP
       			WHERE did = d_id AND isd = FALSE
            	RETURNING sid, vid, did, bid, brid, mid, eat INTO id_values;
		
        WHEN evt='REALLOCATE_TO_BANK' THEN
				UPDATE registry.sb
       			SET 
           			sbevt = 'REALLOCATED_TO_BANK', 
                   	mid = NULL,
					brid = NULL,
					bid = b_id,
 					eby = e_by,
					eid = e_id,
					eat = CURRENT_TIMESTAMP
       			WHERE did = d_id AND isd = FALSE
            	RETURNING sid, vid, did, bid, brid, mid, eat INTO id_values;
		
        ELSE
            RAISE EXCEPTION 'Unsupported event type: %', evt;
    END CASE;

    IF evt LIKE 'DEACTIVATE%' OR evt LIKE 'DELETE%'THEN
        RETURN QUERY SELECT 
            rowid, 
            1,  
            ARRAY['SUCCESS'::registry.sb_msgs],  
            ARRAY[]::text[],  
            ARRAY[]::VARCHAR[],  
            CURRENT_TIMESTAMP::timestamp,
			bank_id,
			branch_id,
			last_action;
    ELSE
	 	SELECT sb.bid INTO bank_id FROM registry.sb WHERE sb.did = d_id;
		SELECT sb.brid INTO branch_id FROM registry.sb WHERE sb.did = d_id;
	
        SELECT 
        v.vpa, d.dname, b.bname, br.brname, m.mname
        INTO result_values
        FROM registry.sb sb
        LEFT JOIN registry.vpa v ON sb.vid = v.vid
        LEFT JOIN registry.devices d ON sb.did = d.did
        LEFT JOIN registry.banks b ON sb.bid = b.bid
        LEFT JOIN registry.branches br ON sb.brid = br.brid
        LEFT JOIN registry.merchants m ON sb.mid = m.mpid
        WHERE sb.did = d_id AND sb.isd = FALSE;

		
        RETURN QUERY SELECT 
            rowid, 
            1,  
            ARRAY['SUCCESS'::registry.sb_msgs],    
            headers_array,  
            ARRAY[result_values.dname, result_values.vpa, result_values.bname, result_values.brname, result_values.mname],  
            id_values.eat::timestamp,
			bank_id,
			branch_id,
			last_action;
    END IF;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.sb_iterator(
	rowid INT[],
	evt VARCHAR,
	vpa TEXT[],	
    dname TEXT[],
    bname TEXT[],
    brname TEXT[],
	mname TEXT[],
    e_by TEXT[],
    eid INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msgs registry.sb_msgs[],id_headers TEXT[],id_values VARCHAR[],eat timestamp,bid INTEGER,brid INTEGER,last_action registry.sbevts) AS $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(rowid, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.sb_validator_writer(
			rowid[i],
			evt,
            COALESCE(vpa[i],NULL),
            COALESCE(dname[i],NULL), 
            COALESCE(bname[i],NULL),
			COALESCE(brname[i],NULL),
			COALESCE(mname[i],NULL),
            e_by[i], 
            eid[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;


----------------------------------------------ONBOARD_DEVICE--------------------------------------------
DROP FUNCTION IF EXISTS registry.onboard_device;

CREATE OR REPLACE FUNCTION registry.onboard_device(
    rowid INT[],
    onboard_status VARCHAR,
    event VARCHAR,
    d_id INT[],
    d_names TEXT[],
    mf_name TEXT[],
    md_name TEXT[],
    f_name TEXT[],
    imei TEXT[],
    vpa TEXT[],
    b_name TEXT[],
    br_name TEXT[],
    m_name TEXT[],
    event_bys TEXT[],
    eids INT[],
    sbe BOOLEAN[]
) 
RETURNS TABLE (
    row_id INTEGER, 
    status INTEGER, 
    event_response VARCHAR,
    steps TEXT[],
    step_status INTEGER[],
    update_device_response registry.devices_msgs[],
    onboard_device_response registry.devices_msgs[],
    onboard_vpa_response registry.vpa_msgs[],
    bind_device_response registry.sb_msgs[],
    allocate_to_bank_response registry.sb_msgs[],
    allocate_to_branch_response registry.sb_msgs[],
    allocate_to_merchant_response registry.sb_msgs[],
    bid INTEGER,
    brid INTEGER
) AS
$$
DECLARE
    final_status INTEGER;
    action_steps TEXT[];
BEGIN
    IF event = 'UPDATE_DEVICE' OR event = 'ENABLE_SOUNDBOX' THEN
        RETURN QUERY 
        SELECT up.row_id, up.status, did,
               ARRAY['UPDATE_DEVICE']::TEXT[],
               ARRAY[up.status]::INTEGER[],
               msg,
               ARRAY[]::registry.devices_msgs[],
               ARRAY[]::registry.vpa_msgs[],
               ARRAY[]::registry.sb_msgs[],
               ARRAY[]::registry.sb_msgs[],
               ARRAY[]::registry.sb_msgs[],
               ARRAY[]::registry.sb_msgs[],
               NULL::INT, NULL::INT
        FROM registry.device_iterator(
            rowid,
            d_id, 
            ARRAY[]::TEXT[],
            ARRAY[]::TEXT[],
            ARRAY[]::TEXT[],
            f_name,
            ARRAY[]::TEXT[],
            sbe,
            event_bys,   
            eids
        ) AS up;
    ELSE 
        IF onboard_status = 'To Inventory' THEN
            RETURN QUERY 
            SELECT inv.row_id, inv.status, did,
                   ARRAY['ONBOARD_DEVICE']::TEXT[],
                   ARRAY[inv.status]::INTEGER[],
                   ARRAY[]::registry.devices_msgs[],
                   msg,
                   ARRAY[]::registry.vpa_msgs[],
                   ARRAY[]::registry.sb_msgs[],
                   ARRAY[]::registry.sb_msgs[],
                   ARRAY[]::registry.sb_msgs[],
                   ARRAY[]::registry.sb_msgs[],
                   NULL::INT, NULL::INT
            FROM registry.device_iterator(
                rowid,
                ARRAY[]::INT[], 
                mf_name,
                d_names,
                md_name,
                f_name,
                imei,
                sbe,
                event_bys,   
                eids
            ) AS inv;
        ELSIF onboard_status = 'Allocated to Bank' OR onboard_status = 'Allocated to Branch' OR onboard_status = 'Allocated to Merchant' THEN
        BEGIN
            CREATE TEMP TABLE temp_onboard_result (
                row_id INTEGER PRIMARY KEY,
                onb_status INTEGER DEFAULT NULL,
                onboard_device_response registry.devices_msgs[],
                onboard_vpa_status INTEGER DEFAULT NULL,
                onboard_vpa_response registry.vpa_msgs[],
                bind_device_status INTEGER DEFAULT NULL,
                bind_device_response registry.sb_msgs[],
                allocate_bank_status INTEGER DEFAULT NULL,
                allocate_bank_response registry.sb_msgs[],
                allocate_branch_status INTEGER DEFAULT NULL,
                allocate_branch_response registry.sb_msgs[],
                allocate_merchant_status INTEGER DEFAULT NULL,
                allocate_merchant_response registry.sb_msgs[],
                device_id VARCHAR DEFAULT NULL,
                bank_id_resolved INTEGER DEFAULT NULL,
                branch_id_resolved INTEGER DEFAULT NULL
            ) ON COMMIT DROP;

            INSERT INTO temp_onboard_result (row_id, onb_status, onboard_device_response, device_id)
            SELECT od.row_id, od.status, msg, did
            FROM registry.device_iterator(
                rowid,
                ARRAY[]::INT[], 
                mf_name,
                d_names,
                md_name,
                f_name,
                imei,
                sbe,
                event_bys,   
                eids
            ) AS od;

            IF vpa IS NOT NULL AND cardinality(vpa) > 0 AND vpa[1] IS NOT NULL THEN

                UPDATE temp_onboard_result tor
                SET onboard_vpa_status = vpa_result.status,
                    onboard_vpa_response = vpa_result.msg
                FROM (
                    SELECT ov.row_id, ov.status, msg
                    FROM registry.vpa_iterator(
                        rowid,
                        vpa,
                        d_names,
                        b_name,
                        event_bys,
                        eids
                    ) AS ov
                ) AS vpa_result
                WHERE tor.row_id = vpa_result.row_id;

                UPDATE temp_onboard_result tor
                SET bind_device_status = bind_result.status,
                    bind_device_response = bind_result.msgs
                FROM (
                    SELECT bd.row_id, bd.status, msgs
                    FROM registry.sb_iterator(
                        rowid,
                        'BIND_DEVICE',
                        vpa,    
                        d_names,
                        ARRAY[]::TEXT[],
                        ARRAY[]::TEXT[],
                        ARRAY[]::TEXT[],
                        event_bys,
                        eids
                    ) AS bd
                ) AS bind_result
                WHERE tor.row_id = bind_result.row_id;
            END IF;

            UPDATE temp_onboard_result tor
            SET allocate_bank_status = bank_result.status,
                allocate_bank_response = bank_result.msgs,
                bank_id_resolved = bank_result.bid
            FROM (
                SELECT ab.row_id, ab.status, msgs, ab.bid
                FROM registry.sb_iterator(
                    rowid,
                    'ALLOCATE_TO_BANK',
                    ARRAY[]::TEXT[],    
                    d_names,
                    b_name,
                    ARRAY[]::TEXT[],
                    ARRAY[]::TEXT[],
                    event_bys,
                    eids
                ) AS ab
            ) AS bank_result 
            WHERE tor.row_id = bank_result.row_id;

            action_steps := ARRAY['ONBOARD_DEVICES','ONBOARD_VPA','BIND_DEVICE','ALLOCATE_TO_BANK']::TEXT[];

            IF onboard_status = 'Allocated to Branch' OR onboard_status = 'Allocated to Merchant' THEN
                UPDATE temp_onboard_result tor
                SET allocate_branch_status = branch_result.status,
                    allocate_branch_response = branch_result.msgs,
                    branch_id_resolved = branch_result.brid
                FROM (
                    SELECT abr.row_id, abr.status, msgs, abr.brid
                    FROM registry.sb_iterator(
                        rowid,
                        'ALLOCATE_TO_BRANCH',
                        ARRAY[]::TEXT[],    
                        d_names,
                        ARRAY[]::TEXT[],
                        br_name,
                        ARRAY[]::TEXT[],
                        event_bys,
                        eids
                    ) AS abr
                ) AS branch_result
                WHERE tor.row_id = branch_result.row_id;

                action_steps := ARRAY['ONBOARD_DEVICES','ONBOARD_VPA','BIND_DEVICE','ALLOCATE_TO_BANK','ALLOCATE_TO_BRANCH']::TEXT[];
            END IF;

            IF onboard_status = 'Allocated to Merchant' THEN
                UPDATE temp_onboard_result tor
                SET allocate_merchant_status = merchant_result.status,
                    allocate_merchant_response = merchant_result.msgs
                FROM (
                    SELECT am.row_id, am.status, msgs
                    FROM registry.sb_iterator(
                        rowid,
                        'ALLOCATE_TO_MERCHANT',
                        ARRAY[]::TEXT[],    
                        d_names,
                        ARRAY[]::TEXT[],
                        ARRAY[]::TEXT[],
                        m_name,
                        event_bys,
                        eids
                    ) AS am
                ) AS merchant_result
                WHERE tor.row_id = merchant_result.row_id;

                action_steps := ARRAY['ONBOARD_DEVICE','ONBOARD_VPA','BIND_DEVICE','ALLOCATE_TO_BANK','ALLOCATE_TO_BRANCH','ALLOCATE_TO_MERCHANT']::TEXT[];
            END IF;

            RETURN QUERY
            SELECT 
                tor.row_id, 
                CASE 
                    WHEN tor.onb_status = 0 OR tor.onboard_vpa_status = 0 OR tor.bind_device_status = 0 OR 
                         tor.allocate_bank_status = 0 OR tor.allocate_branch_status = 0 OR tor.allocate_merchant_status = 0 
                    THEN 0 
                    ELSE 1 
                END AS final_status,
                tor.device_id,
                action_steps,
                ARRAY[tor.onb_status, tor.onboard_vpa_status, tor.bind_device_status, 
                      tor.allocate_bank_status, tor.allocate_branch_status, tor.allocate_merchant_status]::INTEGER[],
                ARRAY[]::registry.devices_msgs[],	  
                tor.onboard_device_response, 
                tor.onboard_vpa_response,
                tor.bind_device_response,
                tor.allocate_bank_response, 
                tor.allocate_branch_response, 
                tor.allocate_merchant_response,
                tor.bank_id_resolved,
                tor.branch_id_resolved
            FROM temp_onboard_result tor;
        END;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;
