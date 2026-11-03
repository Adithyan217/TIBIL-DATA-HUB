------------------ONBOARD_BANK--------------------

CREATE OR REPLACE FUNCTION registry.bank_validator(b_name VARCHAR ) 
RETURNS BOOLEAN AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM registry.banks WHERE registry.banks.bname = b_name) THEN
        RETURN FALSE;
    END IF;
    RETURN TRUE;
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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,b_id INTEGER) AS $$
DECLARE
    bank_id INTEGER;
    bevt registry.bevts := 'BANK_ONBOARDED';
BEGIN
    IF registry.bank_validator(bname) THEN
    	INSERT INTO registry.banks (bname, baddr, bevt, binfo, eby, eid)
    	VALUES (bname, baddr, bevt, binfo, eby, eid)
    	RETURNING bid INTO bank_id ;
    	RETURN QUERY SELECT rowid, 1, 'Insertion Successful',bank_id;
	ELSE 
		RETURN QUERY SELECT rowid, 0, 'Validation Failed',0;
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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,bid INTEGER) AS
$$
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


------------------ONBOARD_BRANCHES--------------------


CREATE OR REPLACE FUNCTION registry.branch_validator(br_name VARCHAR,b_id INTEGER) 
RETURNS BOOLEAN AS $$
BEGIN
   	IF EXISTS (SELECT 1 FROM registry.branches WHERE brname = br_name ) THEN
            RETURN FALSE;
    END IF;
	
	IF NOT EXISTS (SELECT 1 FROM registry.banks WHERE bid = b_id AND isd = 'false') THEN
    		RETURN FALSE;
	END IF;

    RETURN TRUE;
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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,br_id INTEGER) AS $$
DECLARE
    brevt registry.brevts := 'BRANCH_ONBOARDED';
    br_id INTEGER;
BEGIN
    IF registry.branch_validator(brname,bid) THEN
    	INSERT INTO registry.branches (brname,bid, braddr, brevt, brinfo, eby, eid)
    	VALUES (brname,bid, braddr, brevt, brinfo, eby, eid)
        RETURNING brid INTO br_id;
        RETURN QUERY SELECT rowid, 1, 'Insertion Successful',br_id;
	ELSE 
		RETURN QUERY SELECT rowid, 0, 'Validation Failed',0;
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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,brid INTEGER) AS
$$
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



------------------ONBOARD_DEVICES--------------------


CREATE OR REPLACE FUNCTION registry.device_validator(d_name VARCHAR,mf_id INTEGER,md_id INTEGER,f_id INTEGER ) 
RETURNS BOOLEAN AS $$
BEGIN
   	IF EXISTS (SELECT 1 FROM registry.devices WHERE dname = d_name ) THEN
        RETURN FALSE;
    END IF;
	
	IF NOT EXISTS (SELECT 1 FROM registry.mf WHERE mfid = mf_id AND isd = 'false') THEN
    	RETURN FALSE;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM registry.model WHERE mdid = md_id AND isd = 'false') THEN
    	RETURN FALSE;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM registry.firmware WHERE fid = f_id AND isd = 'false') THEN
    	RETURN FALSE;
	END IF;

    RETURN TRUE;
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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,d_id INTEGER) AS $$
DECLARE
    devt registry.devts := 'DEVICE_ONBOARDED';
	d_id INTEGER ;
BEGIN
    IF registry.device_validator(dname,mfid,mdid,fid) THEN
    	INSERT INTO registry.devices (eid, devt, eby, dname, mfid, mdid, fid)
    	VALUES (eid, devt, eby, dname, mfid, mdid, fid)
		RETURNING did INTO d_id;
        RETURN QUERY SELECT rowid, 1, 'Insertion Successful',d_id;
	ELSE 
		RETURN QUERY SELECT rowid, 0, 'Validation Failed',0;
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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,did INTEGER) AS
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



------------------ONBOARD_FIRMWARE--------------------

CREATE OR REPLACE FUNCTION registry.firmware_validator(f_name VARCHAR,mf_id INTEGER) 
RETURNS BOOLEAN AS $$
BEGIN
   	IF EXISTS (SELECT 1 FROM registry.firmware WHERE fname = f_name ) THEN
        RETURN FALSE;
    END IF;
	
	IF NOT EXISTS (SELECT 1 FROM registry.mf WHERE mfid = mf_id AND isd = 'false') THEN
    	RETURN FALSE;
	END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.firmware_validator_writer(
    rowid INTEGER,
	mfid INTEGER,
    fname VARCHAR,
    eby INTEGER,
    eid INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,f_id INTEGER) AS $$
DECLARE
    frevt registry.frevts := 'FIRMWARE_ONBOARDED';
	f_id INTEGER;
BEGIN
    IF registry.firmware_validator(fname,mfid) THEN
    	INSERT INTO registry.firmware (eid, frevt, eby, fname, mfid)
    	VALUES (eid, frevt, eby, fname, mfid)
		RETURNING fid INTO f_id;
		RETURN QUERY SELECT rowid, 1, 'Insertion Successful',f_id;		
	ELSE 
		RETURN QUERY SELECT rowid, 0, 'Validation Failed',0;
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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,fid INTEGER) AS
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



------------------ONBOARD_MERCHANTS--------------------


CREATE OR REPLACE FUNCTION registry.merchant_validator(m_name VARCHAR,br_id INTEGER,b_id INTEGER) 
RETURNS BOOLEAN AS $$
BEGIN
   	IF EXISTS (SELECT 1 FROM registry.merchants WHERE mname = m_name ) THEN
        RETURN FALSE;
    END IF;

	-- IF EXISTS (SELECT 1 FROM registry.merchants WHERE msid = ms_id ) THEN
 --        RETURN FALSE;
 --    END IF;

	IF NOT EXISTS (SELECT 1 FROM registry.branches WHERE brid = br_id AND isd = 'false') THEN
    	RETURN FALSE;
	END IF;
	
	IF NOT EXISTS (SELECT 1 FROM registry.banks WHERE bid = b_id AND isd = 'false') THEN
    	RETURN FALSE;
	END IF;

    RETURN TRUE;
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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,mp_id INTEGER) AS $$
DECLARE
    mevt registry.mevts := 'MERCHANT_ONBOARDED';
	mp_id INTEGER;
BEGIN
    IF registry.merchant_validator(mname,brid,bid) THEN
    	INSERT INTO registry.merchants (eid, mevt, eby, mname,bid,brid,minfo,msid)
    	VALUES (eid, mevt, eby, mname,bid,brid,minfo,msid)
		RETURNING mpid INTO mp_id;
		RETURN QUERY SELECT rowid, 1, 'Insertion Successful',mp_id;		
	ELSE 
		RETURN QUERY SELECT rowid, 0, 'Validation Failed',0;
	END IF;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.merchant_iterator(
	rowid INT[],
    mname TEXT[],
	bid INT[],
	brid INT[],
	minfo JSONB[],
	msid INT[],
    event_bys INT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,mpid INTEGER) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(mname, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.merchant_validator_writer(
			rowid[i],
    		mname[i],
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


------------------ONBOARD_MF--------------------


CREATE OR REPLACE FUNCTION registry.mf_validator(mf_name VARCHAR) 
RETURNS BOOLEAN AS $$
BEGIN
   	IF EXISTS (SELECT 1 FROM registry.mf WHERE mfname = mf_name ) THEN
            RETURN FALSE;
    END IF;

    RETURN TRUE;
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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,mf_id INTEGER) AS $$
DECLARE
    mfevt registry.mfevts := 'MF_ONBOARDED';
	mf_id INTEGER;
BEGIN
    IF registry.mf_validator(mfname) THEN
    	INSERT INTO registry.mf (mfname, mfaddr, mfevt, mfinfo, eby, eid)
    	VALUES (mfname, mfaddr, mfevt, mfinfo, eby, eid)
		RETURNING mfid INTO mf_id;
        RETURN QUERY SELECT rowid, 1, 'Insertion Successful',mf_id;
	ELSE 
		RETURN QUERY SELECT rowid, 0, 'Validation Failed',0;
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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,mfid INTEGER) AS
$$
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



------------------ONBOARD_MODEL--------------------

CREATE OR REPLACE FUNCTION registry.model_validator(md_name VARCHAR,mf_id INTEGER,f_id INTEGER) 
RETURNS BOOLEAN AS $$
BEGIN
   	IF EXISTS (SELECT 1 FROM registry.model WHERE mdname = md_name ) THEN
        RETURN FALSE;
    END IF;
	
	IF NOT EXISTS (SELECT 1 FROM registry.mf WHERE mfid = mf_id AND isd = 'false') THEN
    	RETURN FALSE;
	END IF;
	
	IF NOT EXISTS (SELECT 1 FROM registry.firmware WHERE fid = f_id AND isd = 'false') THEN
    	RETURN FALSE;
	END IF;
    RETURN TRUE;
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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,md_id INTEGER) AS $$
DECLARE
    mdevt registry.mdevts := 'MODEL_ONBOARDED';
	md_id INTEGER;
BEGIN
    IF registry.model_validator(mdname,mfid,fid) THEN
    	INSERT INTO registry.model (eid, mdevt, eby, mdname, mfid,fid)
    	VALUES (eid, mdevt, eby, mdname, mfid,fid)
		RETURNING mdid INTO md_id;
		RETURN QUERY SELECT rowid, 1, 'Insertion Successful',md_id;		
	ELSE 
		RETURN QUERY SELECT rowid, 0, 'Validation Failed',0;
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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,mdid INTEGER) AS
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


------------------ONBOARD_VPA--------------------

CREATE OR REPLACE FUNCTION registry.vpa_validator(vpa_name VARCHAR,b_id INTEGER) 
RETURNS BOOLEAN AS $$
BEGIN
   	IF EXISTS (SELECT 1 FROM registry.vpa WHERE vpa = vpa_name ) THEN
        RETURN FALSE;
    END IF;
	
	IF NOT EXISTS (SELECT 1 FROM registry.banks WHERE bid = b_id AND isd = 'false') THEN
    	RETURN FALSE;
	END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.vpa_validator_writer(
    rowid INTEGER,
    vpa VARCHAR,
	bid INTEGER,
    eby INTEGER,
    eid INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,v_id INTEGER) AS $$
DECLARE
    vevt registry.vevts := 'VPA_ONBOARDED';
	v_id INTEGER;
BEGIN
    IF registry.vpa_validator(vpa,bid) THEN
    	INSERT INTO registry.vpa (eid, vevt, eby, vpa,bid)
    	VALUES (eid, vevt, eby, vpa,bid)
		RETURNING vid INTO v_id;
		RETURN QUERY SELECT rowid, 1, 'Insertion Successful',v_id;		
	ELSE 
		RETURN QUERY SELECT rowid, 0, 'Validation Failed',0;
	END IF;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.vpa_iterator(
	rowid INT[],
    vpa TEXT[],
	bid INT[],
    event_bys INT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,vid INTEGER) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(vpa, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.vpa_validator_writer(
			rowid[i],
    		vpa[i],
			bid[i],
    		event_bys[i],   
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;


------------------ONBOARD_--------------------
