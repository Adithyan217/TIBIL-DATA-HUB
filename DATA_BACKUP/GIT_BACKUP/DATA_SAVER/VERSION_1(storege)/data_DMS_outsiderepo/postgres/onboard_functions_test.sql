CREATE OR REPLACE FUNCTION registry.bank_validator(b_name VARCHAR ) 
RETURNS INTEGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM registry.banks WHERE registry.banks.bname = b_name) THEN
        RETURN 0;
    END IF;
    RETURN 1;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.bank_validator_writer(
    rowid INTEGER,
    bname VARCHAR,
    baddr VARCHAR,
    binfo jsonb,
    eby INTEGER,
    eid INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,bank_name VARCHAR) AS $$
DECLARE
    -- bank_id INTEGER;
    bevt registry.bevts := 'BANK_ONBOARDED';
BEGIN
    IF registry.bank_validator(bname) THEN
    	INSERT INTO registry.banks (bname, baddr, bevt, binfo, eby, eid)
    	VALUES (bname, baddr, bevt, binfo, eby, eid);
    	-- RETURNING bid INTO bank_id ;
    	RETURN QUERY SELECT rowid, 1, 'Insertion Successful',bname;
	ELSE 
		RETURN QUERY SELECT rowid, 0, 'Validation Failed : Bank_name repeated',bname;
	END IF;

	
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.bank_iterator(
	rowid INT[],
    bank_names TEXT[],
    bank_addrs TEXT[],
    binfo_list JSONB[],
    event_bys INT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,bname VARCHAR) AS $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(bank_names, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.bank_validator_writer(
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



EXPLAIN ANALYZE
SELECT row_id,status,msg,bname FROM registry.bank_iterator(
	ARRAY[1,2],
    ARRAY['bank3', 'bank4'], 
    ARRAY['1st Main Road', '2nd Main Road'], 
    ARRAY[
        '{"name": "sbi", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}',
        '{"name": "aaa", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}'
    ]::jsonb[], 
    ARRAY[1, 1], 
    ARRAY[2, 2]
);

---------------------------------------------------------------------------------------------------------------------
-------------------------------------------ONBOARD_MF------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION registry.mf_validator(mf_name VARCHAR) 
RETURNS INTEGER AS $$
BEGIN
   	IF EXISTS (SELECT 1 FROM registry.mf WHERE mfname = mf_name ) THEN
            RETURN 0;
    END IF;

    RETURN 1;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.mf_validator_writer(
    rowid INTEGER,
    mfname VARCHAR,
    mfaddr VARCHAR,
    mfinfo jsonb,
    eby INTEGER,
    eid INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,mf_name VARCHAR) AS $$
DECLARE
    mfevt registry.mfevts := 'MF_ONBOARDED';
	-- mf_id INTEGER;
BEGIN
    IF registry.mf_validator(mfname) THEN
    	INSERT INTO registry.mf (mfname, mfaddr, mfevt, mfinfo, eby, eid)
    	VALUES (mfname, mfaddr, mfevt, mfinfo, eby, eid);
		-- RETURNING mfid INTO mf_id;
        RETURN QUERY SELECT rowid, 1, 'Insertion Successful',mfname;
	ELSE 
		RETURN QUERY SELECT rowid, 0, 'Validation Failed : mf_name repeated',mfname;
	END IF;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.mf_iterator(
	rowid INT[],
    mf_names TEXT[],
    mf_addrs TEXT[],
    mfinfo_list JSONB[],
    event_bys INT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,mfname VARCHAR) AS $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(mf_names, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.mf_validator_writer(
			rowid[i],
            mf_names[i], 
            mf_addrs[i], 
            mfinfo_list[i], 
            event_bys[i], 
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;


SELECT * FROM registry.mf_iterator(
	ARRAY[1,2],
    ARRAY['mf_3', 'mf_4'], 
    ARRAY['1st Main Road', '2nd Main Road'], 
    ARRAY[
        '{"name": "sbi", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}',
        '{"name": "aaa", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}'
    ]::jsonb[], 
    ARRAY[1, 1], 
    ARRAY[2, 2]
);



---------------------------------------------------------------------------------------------------------------------
-------------------------------------------ONBOARD_BRANCHES------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION registry.branch_validator(br_name VARCHAR,b_id INTEGER) 
RETURNS INTEGER AS $$
BEGIN
   	IF EXISTS (SELECT 1 FROM registry.branches WHERE brname = br_name ) THEN
            RETURN 2;
    END IF;
	
	IF NOT EXISTS (SELECT 1 FROM registry.banks WHERE bid = b_id AND isd = 'false') THEN
    		RETURN 3;
	END IF;

    RETURN 1;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.branch_validator_writer(
    rowid INTEGER,
	bid INTEGER,
    brname VARCHAR,
    braddr VARCHAR,
    brinfo jsonb,
    eby INTEGER,
    eid INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,br_name VARCHAR) AS $$
DECLARE
    brevt registry.brevts := 'BRANCH_ONBOARDED';
    br_id INTEGER;
	validator_value INTEGER;
BEGIN
	validator_value := registry.branch_validator(brname,bid);
    IF validator_value = 1 THEN
    	INSERT INTO registry.branches (brname,bid, braddr, brevt, brinfo, eby, eid)
    	VALUES (brname,bid, braddr, brevt, brinfo, eby, eid)
        RETURNING brid INTO br_id;
        RETURN QUERY SELECT rowid, 1, 'Insertion Successful',brname;
	ELSIF validator_value = 2 THEN
		RETURN QUERY SELECT rowid, 0, 'Validation Failed : branch_name repeated',brname;
	ELSE
		RETURN QUERY SELECT rowid, 0, 'Validation Failed : invalid/deactivated bank_id',brname;
	END IF;
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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,brname VARCHAR) AS $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(br_names, 1) LOOP
  
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
	ARRAY[3,3],
    ARRAY['branch5', 'branch6'], 
    ARRAY['1st Main Road', '2nd Main Road'], 
    ARRAY[
        '{"name": "sbi", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}',
        '{"name": "aaa", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}'
    ]::jsonb[], 
    ARRAY[1, 1], 
    ARRAY[2, 2]
);


---------------------------------------------------------------------------------------------------------------------
-------------------------------------------ONBOARD_DEVICES------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------


CREATE OR REPLACE FUNCTION registry.device_validator(d_name VARCHAR,mf_id INTEGER,md_id INTEGER,f_id INTEGER ) 
RETURNS INTEGER AS $$
BEGIN
   	IF EXISTS (SELECT 1 FROM registry.devices WHERE dname = d_name ) THEN
        RETURN 2;
    END IF;
	
	IF NOT EXISTS (SELECT 1 FROM registry.mf WHERE mfid = mf_id AND isd = 'false') THEN
    	RETURN 3;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM registry.model WHERE mdid = md_id AND isd = 'false') THEN
    	RETURN 4;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM registry.firmware WHERE fid = f_id AND isd = 'false') THEN
    	RETURN 5;
	END IF;

    RETURN 1;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.device_validator_writer(
    rowid INTEGER,
	mfid INTEGER,
    dname VARCHAR,
    mdid INTEGER ,
    fid INTEGER,
    eby INTEGER,
    eid INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,d_name VARCHAR) AS $$
DECLARE
    devt registry.devts := 'DEVICE_ONBOARDED';
	-- d_id INTEGER ;
	validator_value INTEGER;
BEGIN
	validator_value := registry.device_validator(dname,mfid,mdid,fid);
    IF validator_value=1 THEN
    	INSERT INTO registry.devices (eid, devt, eby, dname, mfid, mdid, fid)
    	VALUES (eid, devt, eby, dname, mfid, mdid, fid);
		-- RETURNING did INTO d_id;
        RETURN QUERY SELECT rowid, 1, 'Insertion Successful',dname;
	ELSIF validator_value = 2 THEN
		RETURN QUERY SELECT rowid, 0, 'Validation Failed: device_name repeated',dname;
	ELSIF validator_value = 3 THEN
		RETURN QUERY SELECT rowid, 0, 'Validation Failed: invalid/deactivated manufacture_id',dname;
	ELSIF validator_value = 4 THEN
		RETURN QUERY SELECT rowid, 0, 'Validation Failed: invalid/deactivated model_id',dname;
	ELSE 
		RETURN QUERY SELECT rowid, 0, 'Validation Failed: invalid/deactivated firmware_id',0,dname;
	END IF;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.device_iterator(
	rowid INT[],
	mf_id INT[],
    d_names TEXT[],
	mdid INT[] ,
    fid INT[],
    event_bys INT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT, dname VARCHAR) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(d_names, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.device_validator_writer(
			rowid[i],
			mf_id[i],
    		d_names[i],
			mdid[i] ,
   			fid[i],
    		event_bys[i],   
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;


SELECT * FROM registry.device_iterator(
	ARRAY[1,2],
	ARRAY[1,2],
    ARRAY['device3', 'device4'], 
    ARRAY[1,1], 
    ARRAY[1,1], 
    ARRAY[2, 2], 
    ARRAY[28, 28]
);

--------------------------------------------------------------------------------------------------------------------
-------------------------------------------ONBOARD_FIRMWARE------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------


CREATE OR REPLACE FUNCTION registry.firmware_validator(f_name VARCHAR,mf_id INTEGER) 
RETURNS INTEGER AS $$
BEGIN
   	IF EXISTS (SELECT 1 FROM registry.firmware WHERE fname = f_name ) THEN
        RETURN 2;
    END IF;
	
	IF NOT EXISTS (SELECT 1 FROM registry.mf WHERE mfid = mf_id AND isd = 'false') THEN
    	RETURN 3;
	END IF;

    RETURN 1;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.firmware_validator_writer(
    rowid INTEGER,
	mfid INTEGER,
    fname VARCHAR,
    eby INTEGER,
    eid INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,f_name VARCHAR) AS $$
DECLARE
    frevt registry.frevts := 'FIRMWARE_ONBOARDED';
	-- f_id INTEGER;
	validator_value INTEGER;
BEGIN
	validator_value := registry.firmware_validator(fname,mfid);
    IF validator_value = 1 THEN
    	INSERT INTO registry.firmware (eid, frevt, eby, fname, mfid)
    	VALUES (eid, frevt, eby, fname, mfid);
		-- RETURNING fid INTO f_id;
		RETURN QUERY SELECT rowid, 1, 'Insertion Successful',fname;	
	ELSIF validator_value = 2 THEN
		RETURN QUERY SELECT rowid, 0, 'Validation Failed : firmware_name repeated',fname;
	ELSE 
		RETURN QUERY SELECT rowid, 0, 'Validation Failed: invalid/deactivated model_id',fname;
	END IF;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.firmware_iterator(
	rowid INT[],
	mf_id INT[],
    f_names TEXT[],
    event_bys INT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,fname VARCHAR) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(f_names, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.firmware_validator_writer(
			rowid[i],
			mf_id[i],
    		f_names[i],
    		event_bys[i],   
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;


SELECT * FROM registry.firmware_iterator(
	ARRAY[1,2],
	ARRAY[3,4],
    ARRAY['firmware_v4', 'firmware_v3'],  
    ARRAY[1, 1], 
    ARRAY[2, 2]
);





---------------------------------------------------------------------------------------------------------------------
-------------------------------------------ONBOARD_MODEL------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------


CREATE OR REPLACE FUNCTION registry.model_validator(md_name VARCHAR,mf_id INTEGER,f_id INTEGER) 
RETURNS INTEGER AS $$
BEGIN
   	IF EXISTS (SELECT 1 FROM registry.model WHERE mdname = md_name ) THEN
        RETURN 2;
    END IF;
	
	IF NOT EXISTS (SELECT 1 FROM registry.mf WHERE mfid = mf_id AND isd = 'false') THEN
    	RETURN 3;
	END IF;
	
	IF NOT EXISTS (SELECT 1 FROM registry.firmware WHERE fid = f_id AND isd = 'false') THEN
    	RETURN 4;
	END IF;
    RETURN 1;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.model_validator_writer(
    rowid INTEGER,
	mfid INTEGER,
    mdname VARCHAR,
	fid INTEGER,
    eby INTEGER,
    eid INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,md_name VARCHAR) AS $$
DECLARE
    mdevt registry.mdevts := 'MODEL_ONBOARDED';
	-- md_id INTEGER;
	validator_value INTEGER;
BEGIN
	validator_value :=registry.model_validator(mdname,mfid,fid) ;
    IF validator_value = 1 THEN
    	INSERT INTO registry.model (eid, mdevt, eby, mdname, mfid,fid)
    	VALUES (eid, mdevt, eby, mdname, mfid,fid);
		-- RETURNING mdid INTO md_id;
		RETURN QUERY SELECT rowid, 1, 'Insertion Successful',mdname;
	ELSIF validator_value = 2 THEN
		RETURN QUERY SELECT rowid, 0, 'Validation Failed : model_name repeated',mdname;
	ELSIF validator_value = 3 THEN
		RETURN QUERY SELECT rowid, 0, 'Validation Failed : invalid/deactivated mf_id',mdname;
	ELSE 
		RETURN QUERY SELECT rowid, 0, 'Validation Failed: invalid/deactivated firmware_id',mdname;
	END IF;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.model_iterator(
	rowid INT[],
	mf_id INT[],
    md_names TEXT[],
	fid INT[],
    event_bys INT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,mdname VARCHAR) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(md_names, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.model_validator_writer(
			rowid[i],
			mf_id[i],
    		md_names[i],
			fid[i],
    		event_bys[i],   
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;


SELECT * FROM registry.model_iterator(
	ARRAY[1,2],
	ARRAY[1,2],
    ARRAY['model_v1', 'model_v2'],  
	ARRAY[1,2],
    ARRAY[1, 1], 
    ARRAY[2, 2]
);



---------------------------------------------------------------------------------------------------------------------
-------------------------------------------ONBOARD_VPA------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------


CREATE OR REPLACE FUNCTION registry.vpa_validator(vpa_name VARCHAR,b_id INTEGER) 
RETURNS INTEGER AS $$
BEGIN
   	IF EXISTS (SELECT 1 FROM registry.vpa WHERE vpa = vpa_name ) THEN
        RETURN 2;
    END IF;
	
	IF NOT EXISTS (SELECT 1 FROM registry.banks WHERE bid = b_id AND isd = 'false') THEN
    	RETURN 3;
	END IF;

    RETURN 1;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.vpa_validator_writer(
    rowid INTEGER,
    vpa VARCHAR,
	bid INTEGER,
    eby INTEGER,
    eid INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,vpa_name VARCHAR) AS $$
DECLARE
    vevt registry.vevts := 'VPA_ONBOARDED';
	-- v_id INTEGER;
	validator_value INTEGER;
BEGIN
    validator_value := registry.vpa_validator(vpa,bid);
    IF validator_value = 1 THEN
    	INSERT INTO registry.vpa (eid, vevt, eby, vpa,bid)
    	VALUES (eid, vevt, eby, vpa,bid);
		-- RETURNING vid INTO v_id;
		RETURN QUERY SELECT rowid, 1, 'Insertion Successful',vpa;	
	ELSIF validator_value = 2 THEN
		RETURN QUERY SELECT rowid, 0, 'Validation Failed: vpa repeated',vpa;
	ELSE 
		RETURN QUERY SELECT rowid, 0, 'Validation Failed: invalid/deactivated bank_id',vpa;
	END IF;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.vpa_iterator(
	rowid INT[],
    vpa_name TEXT[],
	bid INT[],
    event_bys INT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,vpa VARCHAR) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(vpa_name, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.vpa_validator_writer(
			rowid[i],
    		vpa_name[i],
			bid[i],
    		event_bys[i],   
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;

SELECT * FROM registry.vpa_iterator(
	ARRAY[1,2],
    ARRAY['te111111', 'tet1211'],  
	ARRAY[1,2],
    ARRAY[1, 1], 
    ARRAY[28, 28]
);


---------------------------------------------------------------------------------------------------------------------
-------------------------------------------ONBOARD_MERCHANTS------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------


CREATE OR REPLACE FUNCTION registry.merchant_validator(m_name VARCHAR,br_id INTEGER,b_id INTEGER) 
RETURNS INTEGER AS $$
BEGIN
   	IF EXISTS (SELECT 1 FROM registry.merchants WHERE mname = m_name ) THEN
        RETURN 2;
    END IF;

	IF NOT EXISTS (SELECT 1 FROM registry.branches WHERE brid = br_id AND isd = 'false') THEN
    	RETURN 3;
	END IF;
	
	IF NOT EXISTS (SELECT 1 FROM registry.banks WHERE bid = b_id AND isd = 'false') THEN
    	RETURN 4;
	END IF;

    RETURN 1;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.merchant_validator_writer(
    rowid INTEGER,
    mname VARCHAR,
	bid INTEGER,
	brid INTEGER,
	minfo JSONB,
	msid INTEGER,
    eby INTEGER,
    eid INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,m_name VARCHAR) AS $$
DECLARE
    mevt registry.mevts := 'MERCHANT_ONBOARDED';
	-- mp_id INTEGER;
	validator_value INTEGER;
BEGIN
	validator_value := registry.merchant_validator(mname,brid,bid);
    IF validator_value = 1 THEN
    	INSERT INTO registry.merchants (eid, mevt, eby, mname,bid,brid,minfo,msid)
    	VALUES (eid, mevt, eby, mname,bid,brid,minfo,msid);
		-- RETURNING mpid INTO mp_id;
		RETURN QUERY SELECT rowid, 1, 'Insertion Successful',mname;
	ELSIF validator_value = 2 THEN
		RETURN QUERY SELECT rowid, 0, 'Validation Failed: mname repeated',mname;
	ELSIF validator_value = 3 THEN
		RETURN QUERY SELECT rowid, 0, 'Validation Failed: invalid/deactivated branch_id',mname;
	ELSE 
		RETURN QUERY SELECT rowid, 0, 'Validation Failed: invalid/deactivated bank_id',mname;
	END IF;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.merchant_iterator(
	rowid INT[],
    m_name TEXT[],
	bid INT[],
	brid INT[],
	minfo JSONB[],
	msid INT[],
    event_bys INT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,mname VARCHAR) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(m_name, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.merchant_validator_writer(
			rowid[i],
    		m_name[i],
			bid[i],
			brid[i],
			minfo[i],
			msid[i],
    		event_bys[i],   
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;


SELECT * FROM registry.merchant_iterator(
	ARRAY[1,2],
    ARRAY['mer1', 'mer2'],  
	ARRAY[2,2],
	ARRAY[2,2],
	ARRAY[
        '{"name": "sbi", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}',
        '{"name": "aaa", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}'
    ]::jsonb[], 
	ARRAY[2,2],
    ARRAY[1, 1], 
    ARRAY[28, 28]
);



