
CREATE SCHEMA IF NOT EXISTS registry;
------ENUMS------
CREATE TYPE registry.vevts AS ENUM (
  'VPA_ONBOARDED',
  'VPA_DEACTIVATED'
);

CREATE TYPE registry.mfevts AS ENUM (
  'MF_ONBOARDED',
  'MF_DEACTIVATED'
);

CREATE TYPE registry.devts AS ENUM (
  'DEVICE_ONBOARDED',
  'DEVICE_DEACTIVATED'
);

CREATE TYPE registry.mevts AS ENUM (
  'MERCHANT_ONBOARDED',
  'MERCHANT_DEACTIVATED'
);

CREATE TYPE registry.bevts AS ENUM (
  'BANK_ONBOARDED',
  'BANK_DEACTIVATED'
);

CREATE TYPE registry.brevts AS ENUM (
  'BRANCH_ONBOARDED',
  'BRANCH_DEACTIVATED'
);

CREATE TYPE registry.frevts AS ENUM (
  'FIRMWARE_ONBOARDED',
  'FIRMWARE_DELETED'
);

CREATE TYPE registry.mdevts AS ENUM (
 'MODEL_ONBOARDED',
 'MODEL_DELETED'
);

CREATE TYPE registry.sbevts AS ENUM (
  'VPA_DEVICE_BOUND',
  'VPA_DEVICE_UNBOUND',
  'ALLOCATED_TO_MERCHANT',
  'REALLOCATED_TO_MERCHANT',
  'ALLOCATED_TO_BRANCH',
  'REALLOCATED_TO_BRANCH',
  'ALLOCATED_TO_BANK',
  'REALLOCATED_TO_BANK',
  'DELIVERY_INITIATED',
  'DELIVERY_ACKNOWLEDGED',
  'DEVICE_RETURNED',
  'ISSUE_REPORTED'
);

CREATE TYPE registry.tevts AS ENUM (
  'CREATED',
  'UPDATED',
  'DELETED'
);


---------------Table--------------

CREATE TABLE IF NOT EXISTS registry.banks (
  bid SERIAL PRIMARY KEY,
  baddr VARCHAR,
  bname VARCHAR,
  binfo JSON,
  bevt registry.bevts,
  eid INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby INTEGER NOT NULL
	);

CREATE TABLE IF NOT EXISTS registry.vpa (
  vid SERIAL PRIMARY KEY,
  vpa VARCHAR UNIQUE NOT NULL,
  bid INTEGER,
  vevt registry.vevts,
  eid INTEGER,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  FOREIGN KEY ("bid") REFERENCES registry.banks ("bid")
);

CREATE TABLE IF NOT EXISTS registry.mf (
  mfid SERIAL PRIMARY KEY,
  mfname VARCHAR UNIQUE,
  mfaddr VARCHAR,
  mfinfo JSON,
  mfevt registry.mfevts,
  eid INTEGER NOT NULL,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false
	);


CREATE TABLE IF NOT EXISTS registry.firmware (
  fid SERIAL PRIMARY KEY,
  mfid INTEGER,
  fname VARCHAR,
  frevt registry.frevts,
  eid INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby INTEGER NOT NULL,
  FOREIGN KEY ("mfid") REFERENCES registry.mf ("mfid")
);

CREATE TABLE IF NOT EXISTS registry.model (
  mdid SERIAL PRIMARY KEY,
  mfid INTEGER,
  fid INTEGER,
  eid INTEGER NOT NULL,
  mdname VARCHAR,
  mdevt registry.mdevts,
  isd BOOLEAN DEFAULT false,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby INTEGER NOT NULL,
  FOREIGN KEY ("mfid") REFERENCES registry.mf ("mfid"),
  FOREIGN KEY ("fid") REFERENCES registry.firmware ("fid")
);

CREATE TABLE IF NOT EXISTS registry.devices (
  did SERIAL PRIMARY KEY,
  dname VARCHAR UNIQUE NOT NULL,
  mfid INTEGER,
  fid INTEGER,
  mdid INTEGER,
  devt registry.devts,
  eid INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby INTEGER NOT NULL,
  FOREIGN KEY ("mfid") REFERENCES registry.mf ("mfid"),
  FOREIGN KEY ("fid") REFERENCES registry.firmware ("fid"),
  FOREIGN KEY ("mdid") REFERENCES registry.model ("mdid")
);


CREATE TABLE IF NOT EXISTS registry.branches (
  brid SERIAL PRIMARY KEY,
  brname VARCHAR,
  braddr VARCHAR,
  brinfo JSON,
  bid INTEGER,
  brevt registry.brevts,
  eid INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby INTEGER NOT NULL,
  FOREIGN KEY ("bid") REFERENCES registry.banks ("bid"),
  UNIQUE (bid, brid) 
);

CREATE TABLE IF NOT EXISTS registry.merchants (
  mpid SERIAL PRIMARY KEY,
  msid INTEGER,
  mname VARCHAR,
  minfo JSON,
  bid INTEGER,
  mevt registry.mevts,
  eid INTEGER NOT NULL,
  brid INTEGER,
  isd BOOLEAN DEFAULT false,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby INTEGER NOT NULL,
  FOREIGN KEY ("brid") REFERENCES registry.branches ("brid")
);



CREATE TABLE IF NOT EXISTS registry.sb (
  sid SERIAL PRIMARY KEY,
  vid INTEGER,
  mid INTEGER,
  did INTEGER,
  bid INTEGER,
  brid INTEGER,
  sbevt registry.sbevts,
  eid INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby INTEGER NOT NULL NOT NULL,
  UNIQUE (vid, did, bid, brid, mid),
  FOREIGN KEY ("vid") REFERENCES registry.vpa ("vid"),
  FOREIGN KEY ("mid") REFERENCES registry.merchants ("mpid"),
  FOREIGN KEY ("did") REFERENCES registry.devices ("did"),
  FOREIGN KEY ("bid") REFERENCES registry.banks ("bid"),
  FOREIGN KEY ("bid", "brid") REFERENCES registry.branches ("bid", "brid")
);


-----------Version Table-----------



CREATE TABLE IF NOT EXISTS registry.banks_v (
  bid INTEGER,
  bname VARCHAR,
  bevt registry.bevts,
  eid INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby INTEGER NOT NULL,
  op registry.tevts,
  FOREIGN KEY ("bid") REFERENCES registry.banks ("bid")
);

CREATE TABLE IF NOT EXISTS registry.vpa_v (
  vid INTEGER,
  vpa VARCHAR NOT NULL,
  vevt registry.vevts,
  eid INTEGER NOT NULL,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  op registry.tevts,
  FOREIGN KEY ("vid") REFERENCES registry.vpa ("vid")
);



CREATE TABLE IF NOT EXISTS registry.mf_v (
  mfid INTEGER,
  mfname VARCHAR,
  mfevt registry.mfevts,
  mfinfo JSON,
  mfaddr VARCHAR,
  eid INTEGER NOT NULL,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  op registry.tevts,
  FOREIGN KEY ("mfid") REFERENCES registry.mf ("mfid")
);

CREATE TABLE IF NOT EXISTS registry.firmware_v (
  fid SERIAL PRIMARY KEY,
  mfid INTEGER,
  fname VARCHAR,
  frevt registry.frevts,
  eid INTEGER NOT NULL,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  op registry.tevts,
  FOREIGN KEY ("fid") REFERENCES registry.firmware ("fid"),
  FOREIGN KEY ("mfid") REFERENCES registry.mf ("mfid")
);

CREATE TABLE IF NOT EXISTS registry.model_v (
  mdid SERIAL PRIMARY KEY,
  mfid INTEGER,
  fid INTEGER,
  mdevt registry.mdevts,
  eid INTEGER NOT NULL,
  mdname VARCHAR,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  op registry.tevts,
  FOREIGN KEY ("mdid") REFERENCES registry.model ("mdid"),
  FOREIGN KEY ("mfid") REFERENCES registry.mf ("mfid"),
  FOREIGN KEY ("fid") REFERENCES registry.firmware ("fid")
);

CREATE TABLE IF NOT EXISTS registry.devices_v (
  did INTEGER PRIMARY KEY,
  dname VARCHAR UNIQUE NOT NULL,
  mfid INTEGER,
  fid INTEGER,
  mdid INTEGER,
  devt registry.devts,
  eid INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby INTEGER NOT NULL,
  op registry.tevts,
  FOREIGN KEY ("did") REFERENCES registry.devices ("did"),
  FOREIGN KEY ("mfid") REFERENCES registry.mf ("mfid"),
  FOREIGN KEY ("fid") REFERENCES registry.firmware ("fid"),
  FOREIGN KEY ("mdid") REFERENCES registry.model ("mdid")
);


CREATE TABLE IF NOT EXISTS registry.branches_v (
  brid INTEGER,
  brname VARCHAR,
  braddr VARCHAR,
  bid INTEGER,
  brinfo JSON,
  brevt registry.brevts,
  eid INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby INTEGER NOT NULL,
  op registry.tevts,
  FOREIGN KEY ("brid") REFERENCES registry.branches ("brid"),
  FOREIGN KEY ("bid") REFERENCES registry.banks ("bid")
);



CREATE TABLE IF NOT EXISTS registry.merchants_v (
  mpid INTEGER,
  msid INTEGER,
  mname VARCHAR,
  minfo JSON,
  bid INTEGER,
  mevt registry.mevts,
  eid INTEGER NOT NULL,
  brid INTEGER,
  isd BOOLEAN DEFAULT false,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby INTEGER NOT NULL,
  op registry.tevts,
  FOREIGN KEY ("mpid") REFERENCES registry.merchants ("mpid"),
  FOREIGN KEY ("brid") REFERENCES registry.branches ("brid")
);




CREATE TABLE IF NOT EXISTS registry.sb_v (
  sid INTEGER PRIMARY KEY,
  vid INTEGER,
  mid INTEGER,
  did INTEGER,
  bid INTEGER,
  brid INTEGER,
  sbevt registry.sbevts,
  eid INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby INTEGER NOT NULL,
  op registry.tevts,
  FOREIGN KEY ("sid") REFERENCES registry.sb ("sid"),
  FOREIGN KEY ("vid") REFERENCES registry.vpa ("vid"),
  FOREIGN KEY ("mid") REFERENCES registry.merchants ("mpid"),
  FOREIGN KEY ("did") REFERENCES registry.devices ("did"),
  FOREIGN KEY ("bid") REFERENCES registry.banks ("bid"),
  FOREIGN KEY ("brid") REFERENCES registry.branches ("brid")
);


---------------Indexes-------------

CREATE INDEX IF NOT EXISTS idx_vpa_vid_vpa ON registry.vpa (vid, vpa);
CREATE INDEX IF NOT EXISTS idx_vpa_v_vid_vpa ON registry.vpa_v (vid, vpa);
CREATE INDEX IF NOT EXISTS idx_mf_mfid_mfname ON registry.mf (mfid, mfname);
CREATE INDEX IF NOT EXISTS idx_mf_v_mfid_mfname ON registry.mf_v (mfid, mfname);
CREATE INDEX IF NOT EXISTS idx_firmware_fid_mfid ON registry.firmware (fid, mfid);
CREATE INDEX IF NOT EXISTS idx_firmware_fid_v_mfid ON registry.firmware_v (fid, mfid);
CREATE INDEX IF NOT EXISTS idx_model_mdid ON registry.model (mdid);
CREATE INDEX IF NOT EXISTS idx_model_v_mdid ON registry.model_v (mdid);
CREATE INDEX IF NOT EXISTS idx_devices_did_dname ON registry.devices (did, dname);
CREATE INDEX IF NOT EXISTS idx_devices_v_did_dname ON registry.devices_v (did, dname);
CREATE INDEX IF NOT EXISTS idx_merchants_mid_mname ON registry.merchants (mpid, mname);
CREATE INDEX IF NOT EXISTS idx_merchants_v_mid_mname ON registry.merchants_v (mpid, mname);
CREATE INDEX IF NOT EXISTS idx_banks_bid_bname ON registry.banks (bid, bname);
CREATE INDEX IF NOT EXISTS idx_banks_v_bid_bname ON registry.banks_v (bid, bname);
CREATE INDEX IF NOT EXISTS idx_branches_brid_brname ON registry.branches (brid, brname);
CREATE INDEX IF NOT EXISTS idx_branches_v_brid_brname ON registry.branches_v (brid, brname);
CREATE INDEX IF NOT EXISTS idx_sb_vid_bid_brid_mid ON registry.sb (vid, bid, brid, mid);





-------------------------------------------ONBOARD_BANK------------------------------------------------------------


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
	context VARCHAR,
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
	IF context = 'INSERT' THEN
	    IF registry.bank_validator(bname) THEN
    		INSERT INTO registry.banks (bname, baddr, bevt, binfo, eby, eid)
    		VALUES (bname, baddr, bevt, binfo, eby, eid);
    		-- RETURNING bid INTO bank_id ;
    		RETURN QUERY SELECT rowid, 1, 'Insertion Successful',bname;
		ELSE 
			RETURN QUERY SELECT rowid, 0, 'Validation Failed : Bank_name repeated',bname;
		END IF;
	ELSIF context = 'UPDATE' THEN
		IF NOT registry.bank_validator(bname) THEN
			RETURN QUERY SELECT rowid,1,'update',bname;
	ELSE 
		RETURN QUERY SELECT 1,0,'invalid context',bname;
	END IF;
	
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.bank_iterator(
	context VARCHAR,
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
			context,
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


SELECT row_id,status,msg,bname FROM registry.bank_iterator(
	'INSERT',
	-- 'UPDATE',
	ARRAY[1,2],
    ARRAY['bank11', 'bank21'], 
    ARRAY['1st Main Road', '2nd Main Road'], 
    ARRAY[
        '{"name": "sbi", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}',
        '{"name": "aaa", "designation": "manager", "phno": "+919876543211", "email": "xyz@gmail.com"}'
    ]::jsonb[], 
    ARRAY[1, 2], 
    ARRAY[28, 29]
);



-------------------------------------------ONBOARD_MF------------------------------------------------------------


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







-------------------------------------------ONBOARD_BRANCHES------------------------------------------------------------


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





-------------------------------------------ONBOARD_DEVICES------------------------------------------------------------



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





-------------------------------------------ONBOARD_FIRMWARE------------------------------------------------------------



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








-------------------------------------------ONBOARD_MODEL------------------------------------------------------------



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






-------------------------------------------ONBOARD_VPA------------------------------------------------------------



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



-------------------------------------------ONBOARD_MERCHANTS------------------------------------------------------------



CREATE OR REPLACE FUNCTION registry.merchant_validator(m_name VARCHAR,br_id INTEGER,b_id INTEGER) 
RETURNS INTEGER AS $$
BEGIN
   	IF EXISTS (SELECT 1 FROM registry.merchants WHERE mname = m_name ) THEN
        RETURN 2;
    END IF;

	IF NOT EXISTS (SELECT 1 FROM registry.branches WHERE brid = br_id AND isd = 'false') THEN
    	RETURN 3;
	END IF;

	------add a validation to check wether the branch has same bid
	
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






CREATE INDEX IF NOT EXISTS idx_vpa_vid_vpa ON dmsr.vpa (vid, vpa);
CREATE INDEX IF NOT EXISTS idx_vpa_v_vid_vpa ON dmsr.vpa_v (vid, vpa);
CREATE INDEX IF NOT EXISTS idx_mf_mfid_mfname ON dmsr.mf (mfid, mfname);
CREATE INDEX IF NOT EXISTS idx_mf_v_mfid_mfname ON dmsr.mf_v (mfid, mfname);
CREATE INDEX IF NOT EXISTS idx_firmware_fid_mfid ON dmsr.firmware (fid, mfid,fname);
CREATE INDEX IF NOT EXISTS idx_firmware_fid_v_mfid ON dmsr.firmware_v (fid, mfid,fname);
CREATE INDEX IF NOT EXISTS idx_model_mdid ON dmsr.model (mdid,mdname,mfid,fid);
CREATE INDEX IF NOT EXISTS idx_model_v_mdid ON dmsr.model_v (mdid,mdname,mfid,fid);
CREATE INDEX IF NOT EXISTS idx_devices_did_dname ON dmsr.devices (did, dname,mfid,fid,mdid);
CREATE INDEX IF NOT EXISTS idx_devices_v_did_dname ON dmsr.devices_v (did, dname,mfid,fid,mdid);
CREATE INDEX IF NOT EXISTS idx_merchants_mid_mname ON dmsr.merchants (mpid, mname,bid);
CREATE INDEX IF NOT EXISTS idx_merchants_v_mid_mname ON dmsr.merchants_v (mpid, mname,bid);
CREATE INDEX IF NOT EXISTS idx_banks_bid_bname ON dmsr.banks (bid, bname);
CREATE INDEX IF NOT EXISTS idx_banks_v_bid_bname ON dmsr.banks_v (bid, bname);
CREATE INDEX IF NOT EXISTS idx_branches_brid_brname ON dmsr.branches (brid, brname,bid);
CREATE INDEX IF NOT EXISTS idx_branches_v_brid_brname ON dmsr.branches_v (brid, brname,bid);
CREATE INDEX IF NOT EXISTS idx_sb_vid_bid_brid_mid ON dmsr.sb (vid, bid, brid, mid);



EXPLAIN ANALYZE
SELECT * FROM dmsr.bank_iterator(
    ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100],
    ARRAY['Bank_1', 'Bank_2', 'Bank_3', 'Bank_4', 'Bank_5', 'Bank_6', 'Bank_7', 'Bank_8', 'Bank_9', 'Bank_10', 'Bank_11', 'Bank_12', 'Bank_13', 'Bank_14', 'Bank_15', 'Bank_16', 'Bank_17', 'Bank_18', 'Bank_19', 'Bank_20', 'Bank_21', 'Bank_22', 'Bank_23', 'Bank_24', 'Bank_25', 'Bank_26', 'Bank_27', 'Bank_28', 'Bank_29', 'Bank_30', 'Bank_31', 'Bank_32', 'Bank_33', 'Bank_34', 'Bank_35', 'Bank_36', 'Bank_37', 'Bank_38', 'Bank_39', 'Bank_40', 'Bank_41', 'Bank_42', 'Bank_43', 'Bank_44', 'Bank_45', 'Bank_46', 'Bank_47', 'Bank_48', 'Bank_49', 'Bank_50', 'Bank_51', 'Bank_52', 'Bank_53', 'Bank_54', 'Bank_55', 'Bank_56', 'Bank_57', 'Bank_58', 'Bank_59', 'Bank_60', 'Bank_61', 'Bank_62', 'Bank_63', 'Bank_64', 'Bank_65', 'Bank_66', 'Bank_67', 'Bank_68', 'Bank_69', 'Bank_70', 'Bank_71', 'Bank_72', 'Bank_73', 'Bank_74', 'Bank_75', 'Bank_76', 'Bank_77', 'Bank_78', 'Bank_79', 'Bank_80', 'Bank_81', 'Bank_82', 'Bank_83', 'Bank_84', 'Bank_85', 'Bank_86', 'Bank_87', 'Bank_88', 'Bank_89', 'Bank_90', 'Bank_91', 'Bank_92', 'Bank_93', 'Bank_94', 'Bank_95', 'Bank_96', 'Bank_97', 'Bank_98', 'Bank_99', 'Bank_100'],
    ARRAY['2nd Main Road', '1st Main Road', '2nd Main Road', '1st Main Road', '1st Main Road', '2nd Main Road', '2nd Main Road', '1st Main Road', '2nd Main Road', '2nd Main Road', '2nd Main Road', '1st Main Road', '2nd Main Road', '2nd Main Road', '1st Main Road', '2nd Main Road', '2nd Main Road', '1st Main Road', '1st Main Road', '1st Main Road', '1st Main Road', '1st Main Road', '1st Main Road', '2nd Main Road', '1st Main Road', '1st Main Road', '2nd Main Road', '2nd Main Road', '2nd Main Road', '1st Main Road', '2nd Main Road', '1st Main Road', '2nd Main Road', '1st Main Road', '2nd Main Road', '1st Main Road', '2nd Main Road', '1st Main Road', '2nd Main Road', '1st Main Road', '1st Main Road', '1st Main Road', '2nd Main Road', '2nd Main Road', '2nd Main Road', '1st Main Road', '1st Main Road', '2nd Main Road', '1st Main Road', '2nd Main Road', '2nd Main Road', '2nd Main Road', '1st Main Road', '2nd Main Road', '1st Main Road', '1st Main Road', '1st Main Road', '2nd Main Road', '1st Main Road', '2nd Main Road', '1st Main Road', '1st Main Road', '1st Main Road', '2nd Main Road', '1st Main Road', '1st Main Road', '1st Main Road', '2nd Main Road', '1st Main Road', '1st Main Road', '1st Main Road', '1st Main Road', '2nd Main Road', '2nd Main Road', '1st Main Road', '1st Main Road', '1st Main Road', '2nd Main Road', '1st Main Road', '2nd Main Road', '2nd Main Road', '1st Main Road', '2nd Main Road', '1st Main Road', '2nd Main Road', '2nd Main Road', '2nd Main Road', '2nd Main Road', '1st Main Road', '1st Main Road', '1st Main Road', '2nd Main Road', '2nd Main Road', '2nd Main Road', '1st Main Road', '2nd Main Road', '2nd Main Road', '2nd Main Road', '1st Main Road', '2nd Main Road'],
    ARRAY['{"name": "Bank_1", "designation": "Therapeutic radiographer", "phno": "7468490486", "email": "brownterri@example.net"}', '{"name": "Bank_2", "designation": "Personal assistant", "phno": "+1-857-472-1408x662", "email": "michaeladams@example.net"}', '{"name": "Bank_3", "designation": "Field trials officer", "phno": "470-361-2407x548", "email": "reillyrose@example.com"}', '{"name": "Bank_4", "designation": "Intelligence analyst", "phno": "001-455-206-8538x15918", "email": "kevin49@example.com"}', '{"name": "Bank_5", "designation": "Toxicologist", "phno": "(762)722-7919x2368", "email": "christymitchell@example.org"}', '{"name": "Bank_6", "designation": "Hospital doctor", "phno": "+1-434-378-8010", "email": "timothymack@example.org"}', '{"name": "Bank_7", "designation": "Engineer, drilling", "phno": "+1-446-601-9255x3942", "email": "qchapman@example.com"}', '{"name": "Bank_8", "designation": "Educational psychologist", "phno": "890.695.5644x34763", "email": "lyonskevin@example.org"}', '{"name": "Bank_9", "designation": "Manufacturing systems engineer", "phno": "311-784-2513x221", "email": "elizabeth79@example.org"}', '{"name": "Bank_10", "designation": "Illustrator", "phno": "3832392357", "email": "adelgado@example.com"}', '{"name": "Bank_11", "designation": "Herpetologist", "phno": "(716)344-5680", "email": "byrdrenee@example.net"}', '{"name": "Bank_12", "designation": "Horticultural therapist", "phno": "001-381-849-6736x611", "email": "bchristensen@example.org"}', '{"name": "Bank_13", "designation": "Printmaker", "phno": "821.348.5740", "email": "rbell@example.com"}', '{"name": "Bank_14", "designation": "Therapist, art", "phno": "+1-330-336-1340x25835", "email": "david98@example.com"}', '{"name": "Bank_15", "designation": "Designer, ceramics/pottery", "phno": "5398543233", "email": "mitchellwilliam@example.net"}', '{"name": "Bank_16", "designation": "Visual merchandiser", "phno": "374-876-5267x383", "email": "kimberly36@example.net"}', '{"name": "Bank_17", "designation": "Radiographer, therapeutic", "phno": "761.527.5501x743", "email": "melaniegibson@example.org"}', '{"name": "Bank_18", "designation": "Lexicographer", "phno": "393.840.6575x892", "email": "bryantshannon@example.org"}', '{"name": "Bank_19", "designation": "Education officer, museum", "phno": "+1-411-431-0506x77697", "email": "baileybrian@example.net"}', '{"name": "Bank_20", "designation": "Clinical scientist, histocompatibility and immunogenetics", "phno": "001-597-391-9822x46518", "email": "morganjason@example.com"}', '{"name": "Bank_21", "designation": "Arts development officer", "phno": "735-390-6867x152", "email": "cmiller@example.com"}', '{"name": "Bank_22", "designation": "Civil engineer, contracting", "phno": "388-246-4872", "email": "sandra71@example.net"}', '{"name": "Bank_23", "designation": "Special educational needs teacher", "phno": "+1-483-461-3521x6760", "email": "cobbrobert@example.org"}', '{"name": "Bank_24", "designation": "Clinical research associate", "phno": "203.654.5543", "email": "robertbowers@example.com"}', '{"name": "Bank_25", "designation": "Recycling officer", "phno": "+1-659-346-6287x09445", "email": "scott16@example.com"}', '{"name": "Bank_26", "designation": "Radiographer, diagnostic", "phno": "8804409818", "email": "danielmoore@example.com"}', '{"name": "Bank_27", "designation": "Therapist, drama", "phno": "4843514054", "email": "framos@example.org"}', '{"name": "Bank_28", "designation": "Purchasing manager", "phno": "5023510665", "email": "romerotonya@example.net"}', '{"name": "Bank_29", "designation": "Designer, fashion/clothing", "phno": "(530)983-0228x627", "email": "jamesdouglas@example.org"}', '{"name": "Bank_30", "designation": "Multimedia programmer", "phno": "001-625-290-4383x76148", "email": "paul30@example.com"}', '{"name": "Bank_31", "designation": "Web designer", "phno": "765-631-6387x48762", "email": "aaron89@example.net"}', '{"name": "Bank_32", "designation": "Sports therapist", "phno": "+1-343-425-7425", "email": "carolrodriguez@example.net"}', '{"name": "Bank_33", "designation": "Engineer, petroleum", "phno": "(607)809-4670", "email": "fjohnson@example.net"}', '{"name": "Bank_34", "designation": "Journalist, magazine", "phno": "438-422-5194x4614", "email": "nbenson@example.org"}', '{"name": "Bank_35", "designation": "Video editor", "phno": "637.335.6369x629", "email": "turnerphillip@example.com"}', '{"name": "Bank_36", "designation": "Trade union research officer", "phno": "+1-322-871-1589", "email": "petersmith@example.com"}', '{"name": "Bank_37", "designation": "Pharmacist, community", "phno": "+1-314-639-4837x8132", "email": "scruz@example.com"}', '{"name": "Bank_38", "designation": "Geophysicist/field seismologist", "phno": "001-601-951-9513", "email": "scottwilson@example.com"}', '{"name": "Bank_39", "designation": "Production assistant, radio", "phno": "(657)374-5735x704", "email": "jamescase@example.org"}', '{"name": "Bank_40", "designation": "Engineer, maintenance", "phno": "(422)423-9723", "email": "burnettrobert@example.org"}', '{"name": "Bank_41", "designation": "Intelligence analyst", "phno": "869-419-6511x13037", "email": "nguyenkathy@example.com"}', '{"name": "Bank_42", "designation": "Pharmacologist", "phno": "292.632.8697", "email": "david36@example.org"}', '{"name": "Bank_43", "designation": "Surveyor, rural practice", "phno": "998-481-8814", "email": "jacobsmegan@example.com"}', '{"name": "Bank_44", "designation": "Scientist, research (maths)", "phno": "671-545-0683x2851", "email": "wrightjason@example.net"}', '{"name": "Bank_45", "designation": "Pharmacist, community", "phno": "622.717.2778", "email": "hawkinsjohn@example.org"}', '{"name": "Bank_46", "designation": "Publishing rights manager", "phno": "(319)673-7421x823", "email": "ambersolis@example.net"}', '{"name": "Bank_47", "designation": "Equality and diversity officer", "phno": "(239)616-9220x68088", "email": "erincasey@example.org"}', '{"name": "Bank_48", "designation": "Technical sales engineer", "phno": "+1-505-372-6008", "email": "mary25@example.com"}', '{"name": "Bank_49", "designation": "Herpetologist", "phno": "5674990729", "email": "jamesmcclain@example.net"}', '{"name": "Bank_50", "designation": "Intelligence analyst", "phno": "+1-349-560-3603x42238", "email": "shannonguerrero@example.org"}', '{"name": "Bank_51", "designation": "English as a foreign language teacher", "phno": "(211)520-7407", "email": "stantonthomas@example.com"}', '{"name": "Bank_52", "designation": "Politicians assistant", "phno": "472.502.6286x6577", "email": "john31@example.org"}', '{"name": "Bank_53", "designation": "Therapist, occupational", "phno": "(611)350-7096", "email": "laurenwheeler@example.net"}', '{"name": "Bank_54", "designation": "Private music teacher", "phno": "748.574.2663x80874", "email": "zdunn@example.com"}', '{"name": "Bank_55", "designation": "Petroleum engineer", "phno": "(295)491-5552", "email": "kenneth53@example.org"}', '{"name": "Bank_56", "designation": "Scientist, clinical (histocompatibility and immunogenetics)", "phno": "382.703.8767x448", "email": "steven02@example.org"}', '{"name": "Bank_57", "designation": "Hospital doctor", "phno": "496.358.8422", "email": "crystalsimmons@example.net"}', '{"name": "Bank_58", "designation": "Media planner", "phno": "759-404-6801", "email": "kyle80@example.org"}', '{"name": "Bank_59", "designation": "Therapeutic radiographer", "phno": "831.272.8344x7790", "email": "ywebb@example.org"}', '{"name": "Bank_60", "designation": "Engineer, electronics", "phno": "777-935-5020", "email": "michaelberger@example.com"}', '{"name": "Bank_61", "designation": "Clinical cytogeneticist", "phno": "(852)300-5587x8349", "email": "cookerika@example.org"}', '{"name": "Bank_62", "designation": "Office manager", "phno": "001-825-788-9087x52508", "email": "sschultz@example.net"}', '{"name": "Bank_63", "designation": "Site engineer", "phno": "6793130364", "email": "hsnyder@example.net"}', '{"name": "Bank_64", "designation": "Animal nutritionist", "phno": "+1-932-242-4576x4781", "email": "chanandrea@example.org"}', '{"name": "Bank_65", "designation": "Audiological scientist", "phno": "001-957-603-4223", "email": "nicholasgillespie@example.org"}', '{"name": "Bank_66", "designation": "Retail buyer", "phno": "001-485-613-7101x6156", "email": "robert33@example.net"}', '{"name": "Bank_67", "designation": "Legal secretary", "phno": "442-423-8320x51465", "email": "candacesmith@example.com"}', '{"name": "Bank_68", "designation": "Physiological scientist", "phno": "001-569-408-7448x4581", "email": "richardmartin@example.net"}', '{"name": "Bank_69", "designation": "Surveyor, minerals", "phno": "468.611.7741", "email": "martinezrichard@example.com"}', '{"name": "Bank_70", "designation": "Scientist, water quality", "phno": "755-864-3794x3411", "email": "robert09@example.net"}', '{"name": "Bank_71", "designation": "Medical sales representative", "phno": "+1-495-370-2787x532", "email": "gmoore@example.com"}', '{"name": "Bank_72", "designation": "Chief of Staff", "phno": "825-341-7743", "email": "qmccarty@example.net"}', '{"name": "Bank_73", "designation": "Health and safety inspector", "phno": "355.427.6254x64858", "email": "yolandabishop@example.com"}', '{"name": "Bank_74", "designation": "Magazine journalist", "phno": "421.605.7798x819", "email": "marvin05@example.com"}', '{"name": "Bank_75", "designation": "Financial adviser", "phno": "482-813-6128", "email": "amber03@example.net"}', '{"name": "Bank_76", "designation": "Restaurant manager", "phno": "656-354-3537", "email": "shawn62@example.com"}', '{"name": "Bank_77", "designation": "Therapist, sports", "phno": "001-754-917-0532x8348", "email": "nicholas20@example.net"}', '{"name": "Bank_78", "designation": "Conservation officer, nature", "phno": "562-778-2564x0026", "email": "zachary91@example.net"}', '{"name": "Bank_79", "designation": "Designer, multimedia", "phno": "001-470-343-8722", "email": "petersheather@example.org"}', '{"name": "Bank_80", "designation": "Physicist, medical", "phno": "868-563-3926", "email": "qkirby@example.com"}', '{"name": "Bank_81", "designation": "Computer games developer", "phno": "946-227-1875x35408", "email": "dennis07@example.net"}', '{"name": "Bank_82", "designation": "IT consultant", "phno": "236-263-2749x77565", "email": "jcarrillo@example.net"}', '{"name": "Bank_83", "designation": "Pensions consultant", "phno": "599-803-5884x0925", "email": "linda99@example.com"}', '{"name": "Bank_84", "designation": "Airline pilot", "phno": "437.680.9171", "email": "rangelrobert@example.org"}', '{"name": "Bank_85", "designation": "Energy manager", "phno": "984.381.8475", "email": "ujohnson@example.org"}', '{"name": "Bank_86", "designation": "Sport and exercise psychologist", "phno": "+1-803-939-3562x119", "email": "jennifer97@example.com"}', '{"name": "Bank_87", "designation": "Retail merchandiser", "phno": "767.465.2846x0088", "email": "ogutierrez@example.org"}', '{"name": "Bank_88", "designation": "Retail buyer", "phno": "203.647.9628x55010", "email": "david49@example.com"}', '{"name": "Bank_89", "designation": "Arboriculturist", "phno": "(279)771-2069x42437", "email": "bullockrobert@example.org"}', '{"name": "Bank_90", "designation": "Solicitor, Scotland", "phno": "549-932-9309", "email": "thomaselizabeth@example.net"}', '{"name": "Bank_91", "designation": "Careers information officer", "phno": "001-469-659-4998", "email": "rcowan@example.net"}', '{"name": "Bank_92", "designation": "Actor", "phno": "986.596.9041x076", "email": "richardzimmerman@example.net"}', '{"name": "Bank_93", "designation": "IT consultant", "phno": "819.280.4866", "email": "david01@example.net"}', '{"name": "Bank_94", "designation": "Film/video editor", "phno": "993-304-0827x478", "email": "nicholslori@example.com"}', '{"name": "Bank_95", "designation": "Scientist, physiological", "phno": "928-360-2889", "email": "brandon52@example.com"}', '{"name": "Bank_96", "designation": "Broadcast journalist", "phno": "001-961-860-8072x16426", "email": "catherine50@example.net"}', '{"name": "Bank_97", "designation": "Naval architect", "phno": "+1-319-702-7162x67092", "email": "christinalewis@example.net"}', '{"name": "Bank_98", "designation": "Event organiser", "phno": "660-831-1789x7577", "email": "georgemiller@example.net"}', '{"name": "Bank_99", "designation": "Oncologist", "phno": "892-337-7301", "email": "laurie44@example.org"}', '{"name": "Bank_100", "designation": "Comptroller", "phno": "509.821.0169", "email": "kristinamiller@example.org"}']::jsonb[],
    ARRAY[1, 2, 1, 1, 2, 2, 1, 1, 2, 1, 2, 2, 1, 2, 2, 1, 2, 1, 2, 1, 1, 1, 1, 2, 1, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2, 2, 1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1, 2, 1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 1, 1, 2, 2, 2, 2, 2, 1, 2, 1, 2, 1, 2, 2, 1, 1, 1, 1, 2],
    ARRAY[29, 28, 28, 29, 28, 28, 28, 29, 28, 28, 29, 29, 28, 29, 29, 28, 28, 29, 29, 29, 29, 28, 29, 28, 28, 28, 28, 29, 29, 29, 29, 28, 29, 28, 28, 28, 28, 29, 29, 28, 28, 28, 28, 29, 29, 29, 28, 29, 28, 29, 28, 28, 28, 28, 29, 28, 28, 29, 29, 29, 29, 29, 28, 28, 29, 29, 28, 28, 28, 28, 29, 29, 28, 28, 29, 29, 29, 28, 28, 28, 29, 28, 28, 29, 28, 28, 28, 29, 28, 29, 29, 28, 29, 29, 28, 29, 28, 28, 29, 29]
);


-----------FUNCTIONS-----------

DROP FUNCTION IF EXISTS 
    dmsr.bank_validator,
    dmsr.bank_validator_writer,
    dmsr.bank_iterator,
    dmsr.mf_validator,
    dmsr.mf_validator_writer,
    dmsr.mf_iterator,
    dmsr.branch_validator,
    dmsr.branch_validator_writer,
    dmsr.branch_iterator,
    dmsr.device_validator,
    dmsr.device_validator_writer,
    dmsr.device_iterator,
    dmsr.firmware_validator,
    dmsr.firmware_validator_writer,
    dmsr.firmware_iterator,
    dmsr.model_validator,
    dmsr.model_validator_writer,
    dmsr.model_iterator,
    dmsr.vpa_validator,
    dmsr.vpa_validator_writer,
    dmsr.vpa_iterator,
    dmsr.merchant_validator,
    dmsr.merchant_validator_writer,
    dmsr.merchant_iterator;




