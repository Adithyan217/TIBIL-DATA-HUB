
CREATE SCHEMA IF NOT EXISTS registry;
------ENUMS-EVENTS------
CREATE TYPE registry.vevts AS ENUM (
  'VPA_ONBOARDED',
  'VPA_DEACTIVATED',
  'VPA_DELETED'
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
  'VPA_DEVICE_BIND',
  'VPA_DEVICE_UNBIND',
  'ALLOCATED_TO_MERCHANT',
  'REALLOCATED_TO_MERCHANT',
  'ALLOCATED_TO_BRANCH',
  'REALLOCATED_TO_BRANCH',
  'ALLOCATED_TO_BANK',
  'REALLOCATED_TO_BANK',
  'DELIVERY_INITIATED',
  'DELIVERY_ACKNOWLEDGED',
  'DEVICE_RETURNED',
  'ISSUE_REPORTED',
  'DEVICE_ONBOARDED',
  'DEVICE_DEACTIVATED',
  'VPA_DEACTIVATED',
  'BANK_DEACTIVATED',
  'BRANCH_DEACTIVATED',
  'MERCHANT_DEACTIVATED',
  'VPA_DELETED'

);

-------ENUM-MESSAGES-------
CREATE TYPE registry.banks_msgs AS ENUM (
		'SUCCESS_INSERT',
		'SUCCESS_UPDATE',
		'BANK_REPEATED',
		'INVALID_BANK',
		'EMPTY_UPDATE'
);

CREATE TYPE registry.mf_msgs AS ENUM (
		'SUCCESS_INSERT',
		'SUCCESS_UPDATE',
		'MF_REPEATED',
		'INVALID_MF',
		'EMPTY_UPDATE'
);

CREATE TYPE registry.branches_msgs AS ENUM (
		'SUCCESS_INSERT',
		'BRANCH_REPEATED',
		'INVALID_BRANCH',
		'INVALID_BANK',
		'SUCCESS_UPDATE',
		'EMPTY_UPDATE'
);

CREATE TYPE registry.devices_msgs AS ENUM (
		'SUCCESS_INSERT',
		'SUCCESS_UPDATE',
		'DEVICE_REPEATED',
		'INVALID_DEVICE',
		'INVALID_MF',
		'INVALID_FIRMWARE',
		'INVALID_MODEL',
		'EMPTY_UPDATE',
        'IMEI_REPEATED'

);

CREATE TYPE registry.firmware_msgs AS ENUM (
		'SUCCESS_INSERT',
		'FIRMWARE_REPEATED',
		'INVALID_MF'
);

CREATE TYPE registry.models_msgs AS ENUM (
		'SUCCESS_INSERT',
		'MODEL_REPEATED',
		'INVALID_MF',
		'INVALID_FIRMWARE'
);

CREATE TYPE registry.vpa_msgs AS ENUM (
		'SUCCESS_INSERT',
		'VPA_REPEATED',
		'INVALID_BANK'
);

CREATE TYPE registry.merchants_msgs AS ENUM (
		'SUCCESS_INSERT',
		'SUCCESS_UPDATE',
		'MERCHANT_REPEATED',
		'INVALID_BANK',
		'INVALID_MERCHANT',
		'INVALID_BRANCH',
		'EMPTY_UPDATE'
);
		

CREATE TYPE registry.sb_msgs AS ENUM (
  'SUCCESS',
  'INVALID_VPA',
  'INVALID_DEVICE',
  'DEVICE_ALREADY_BINDED',
  'VPA_ALREADY_BINDED',
  'DEVICE_VPA_NOT_BINDED',
  'DEVICE_HAS_DEACTIVATED_BANK',
  'DEVICE_HAS_DEACTIVATED_BRANCH',
  'DEVICE_HAS_DEACTIVATED_MERCHANT',
  'BANK_VPA_UNMATCHED_BID',-----allocated banks bid and vpa bid unmatched
  'INVALID_BANK',
  'BANK_ALREADY_ALLOCATED',
  'DEVICE_HAS_DEACTIVATED_VPA',
  'VPA_BANK_UNMATCHED_BID',-----allocated vpa and banks bid unmatched
  'INVALID_BRANCH',
  'BRANCH_ALREADY_ALLOCATED',
  'BANK_BRANCH_UNMATCHED_BID',------allocated banks and branch bid unmatched
  'INVALID_MERCHANT',
  'MERCHANT_ALREADY_ALLOCATED',
  'BANK_MERCHANT_UNMATCHED_BID',------allocated banks and merchant bid unmatched
  'INVALID_EVENT',
  'UNABLE_TO_ALLOCATE'
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
  bname VARCHAR UNIQUE,
  binfo JSON,
  bevt registry.bevts,
  eid INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  isa BOOLEAN DEFAULT true,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby VARCHAR NOT NULL
	);




CREATE TABLE IF NOT EXISTS registry.vpa (
  vid SERIAL PRIMARY KEY,
  vpa VARCHAR UNIQUE NOT NULL,
  bid INTEGER NOT NULL,
  vevt registry.vevts,
  eid INTEGER,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby VARCHAR NOT NULL,
  isd BOOLEAN DEFAULT false,
  isa BOOLEAN DEFAULT true,
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
  eby VARCHAR NOT NULL,
  isd BOOLEAN DEFAULT false
	);


CREATE TABLE IF NOT EXISTS registry.firmware (
  fid SERIAL PRIMARY KEY,
  mfid INTEGER,
  fname VARCHAR UNIQUE,
  frevt registry.frevts,
  eid INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby VARCHAR NOT NULL,
  FOREIGN KEY ("mfid") REFERENCES registry.mf ("mfid")
);

CREATE TABLE IF NOT EXISTS registry.model (
  mdid SERIAL PRIMARY KEY,
  mfid INTEGER,
  fid INTEGER,
  eid INTEGER NOT NULL,
  mdname VARCHAR UNIQUE,
  mdevt registry.mdevts,
  isd BOOLEAN DEFAULT false,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby VARCHAR NOT NULL,
  FOREIGN KEY ("mfid") REFERENCES registry.mf ("mfid"),
  FOREIGN KEY ("fid") REFERENCES registry.firmware ("fid")
);

CREATE TABLE IF NOT EXISTS registry.devices (
  did SERIAL PRIMARY KEY,
  dname VARCHAR UNIQUE NOT NULL,
  imei VARCHAR UNIQUE NOT NULL,
  mfid INTEGER,
  fid INTEGER,
  mdid INTEGER,
  devt registry.devts,
  eid INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  isa BOOLEAN DEFAULT true,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby VARCHAR NOT NULL,
  FOREIGN KEY ("mfid") REFERENCES registry.mf ("mfid"),
  FOREIGN KEY ("fid") REFERENCES registry.firmware ("fid"),
  FOREIGN KEY ("mdid") REFERENCES registry.model ("mdid")
);


CREATE TABLE IF NOT EXISTS registry.branches (
  brid SERIAL PRIMARY KEY,
  brname VARCHAR UNIQUE,
  braddr VARCHAR,
  brinfo JSON,
  bid INTEGER,
  brevt registry.brevts,
  eid INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  isa BOOLEAN DEFAULT true,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby VARCHAR NOT NULL,
  FOREIGN KEY ("bid") REFERENCES registry.banks ("bid"),
  UNIQUE (bid, brid) 
);

CREATE TABLE IF NOT EXISTS registry.merchants (
  mpid SERIAL PRIMARY KEY,
  msid INTEGER,
  mname VARCHAR UNIQUE,
  minfo JSON,
  bid INTEGER,
  mevt registry.mevts,
  maddr VARCHAR,
  eid INTEGER NOT NULL,
  brid INTEGER,
  isd BOOLEAN DEFAULT false,
  isa BOOLEAN DEFAULT true,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby VARCHAR NOT NULL,
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
  isa BOOLEAN DEFAULT true,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby VARCHAR NOT NULL NOT NULL,
  UNIQUE (vid, did, bid, brid, mid),
  FOREIGN KEY ("vid") REFERENCES registry.vpa ("vid"),
  FOREIGN KEY ("mid") REFERENCES registry.merchants ("mpid"),
  FOREIGN KEY ("did") REFERENCES registry.devices ("did"),
  FOREIGN KEY ("bid") REFERENCES registry.banks ("bid"),
  FOREIGN KEY ("bid", "brid") REFERENCES registry.branches ("bid", "brid")
);

CREATE TABLE IF NOT EXISTS registry.policies (
    pid SERIAL PRIMARY KEY,
    policy_name VARCHAR NOT NULL UNIQUE,
    policy_content TEXT NOT NULL, 
    last_updated TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP 
);

CREATE TABLE IF NOT EXISTS registry.routes (
    rid SERIAL PRIMARY KEY,
    rname VARCHAR NOT NULL,
    notifier VARCHAR,
    isd BOOLEAN NOT NULL DEFAULT false,
    dconfig JSONB,
    security JSONB,
    sconfig JSONB
);


CREATE TABLE IF NOT EXISTS registry.sbroutes (
    sbid SERIAL PRIMARY KEY,
    rid INTEGER NOT NULL,
    did INTEGER NOT NULL,
    isd BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT sbroutes_did_fkey FOREIGN KEY (did)
        REFERENCES registry.devices (did),
    CONSTRAINT sbroutes_rid_fkey FOREIGN KEY (rid)
        REFERENCES registry.routes (rid)
);


-----------Version Table-----------



CREATE TABLE IF NOT EXISTS registry.banks_v (
  pid SERIAL PRIMARY KEY,  
  bid INTEGER,
  bname VARCHAR,
  bevt registry.bevts,
  eid INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  isa BOOLEAN DEFAULT true,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby VARCHAR NOT NULL,
  op registry.tevts,
  FOREIGN KEY ("bid") REFERENCES registry.banks ("bid")
);

CREATE TABLE IF NOT EXISTS registry.vpa_v (
  pid SERIAL PRIMARY KEY,  
  vid INTEGER,
  vpa VARCHAR NOT NULL,
  vevt registry.vevts,
  eid INTEGER NOT NULL,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby VARCHAR NOT NULL,
  isd BOOLEAN DEFAULT false,
  isa BOOLEAN DEFAULT true,
  op registry.tevts,
  FOREIGN KEY ("vid") REFERENCES registry.vpa ("vid")
);



CREATE TABLE IF NOT EXISTS registry.mf_v (
  pid SERIAL PRIMARY KEY,  
  mfid INTEGER,
  mfname VARCHAR,
  mfevt registry.mfevts,
  mfinfo JSON,
  mfaddr VARCHAR,
  eid INTEGER NOT NULL,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby VARCHAR NOT NULL,
  isd BOOLEAN DEFAULT false,
  op registry.tevts,
  FOREIGN KEY ("mfid") REFERENCES registry.mf ("mfid")
);

CREATE TABLE IF NOT EXISTS registry.firmware_v (
  pid SERIAL PRIMARY KEY,
  fid INTEGER,
  mfid INTEGER,
  fname VARCHAR,
  frevt registry.frevts,
  eid INTEGER NOT NULL,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby VARCHAR NOT NULL,
  isd BOOLEAN DEFAULT false,
  op registry.tevts,
  FOREIGN KEY ("fid") REFERENCES registry.firmware ("fid"),
  FOREIGN KEY ("mfid") REFERENCES registry.mf ("mfid")
);

CREATE TABLE IF NOT EXISTS registry.model_v (
  pid SERIAL PRIMARY KEY,
  mdid INTEGER,
  mfid INTEGER,
  fid INTEGER,
  mdevt registry.mdevts,
  eid INTEGER NOT NULL,
  mdname VARCHAR,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby VARCHAR NOT NULL,
  isd BOOLEAN DEFAULT false,
  op registry.tevts,
  FOREIGN KEY ("mdid") REFERENCES registry.model ("mdid"),
  FOREIGN KEY ("mfid") REFERENCES registry.mf ("mfid"),
  FOREIGN KEY ("fid") REFERENCES registry.firmware ("fid")
);

CREATE TABLE IF NOT EXISTS registry.devices_v (
  pid SERIAL PRIMARY KEY,
  did INTEGER ,
  dname VARCHAR ,
  imei VARCHAR ,
  mfid INTEGER,
  fid INTEGER,
  mdid INTEGER,
  devt registry.devts,
  eid INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  isa BOOLEAN DEFAULT true,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby VARCHAR NOT NULL,
  sbe BOOLEAN DEFAULT false,
  op registry.tevts,
  FOREIGN KEY ("did") REFERENCES registry.devices ("did"),
  FOREIGN KEY ("mfid") REFERENCES registry.mf ("mfid"),
  FOREIGN KEY ("fid") REFERENCES registry.firmware ("fid"),
  FOREIGN KEY ("mdid") REFERENCES registry.model ("mdid")
);


CREATE TABLE IF NOT EXISTS registry.branches_v (
  pid SERIAL PRIMARY KEY,  
  brid INTEGER,
  brname VARCHAR,
  braddr VARCHAR,
  bid INTEGER,
  brinfo JSON,
  brevt registry.brevts,
  eid INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  isa BOOLEAN DEFAULT true,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby VARCHAR NOT NULL,
  op registry.tevts,
  FOREIGN KEY ("brid") REFERENCES registry.branches ("brid"),
  FOREIGN KEY ("bid") REFERENCES registry.banks ("bid")
);



CREATE TABLE IF NOT EXISTS registry.merchants_v (
  pid SERIAL PRIMARY KEY,  
  mpid INTEGER,
  msid INTEGER,
  mname VARCHAR,
  minfo JSON,
  bid INTEGER,
  mevt registry.mevts,
  maddr VARCHAR,
  eid INTEGER NOT NULL,
  brid INTEGER,
  isd BOOLEAN DEFAULT false,
  isa BOOLEAN DEFAULT true,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby VARCHAR NOT NULL,
  op registry.tevts,
  FOREIGN KEY ("mpid") REFERENCES registry.merchants ("mpid"),
  FOREIGN KEY ("brid") REFERENCES registry.branches ("brid")
);




CREATE TABLE IF NOT EXISTS registry.sb_v (
  pid SERIAL PRIMARY KEY,
  sid INTEGER ,
  vid INTEGER,
  mid INTEGER,
  did INTEGER,
  bid INTEGER,
  brid INTEGER,
  sbevt registry.sbevts,
  eid INTEGER NOT NULL,
  isd BOOLEAN DEFAULT false,
  isa BOOLEAN DEFAULT true,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eby VARCHAR NOT NULL,
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



CREATE INDEX IF NOT EXISTS idx_sb_did
ON registry.sb (did);

CREATE INDEX IF NOT EXISTS idx_sb_did_isd
ON registry.sb (did,isd);

CREATE INDEX IF NOT EXISTS idx_sb_did_mid
ON registry.sb (did,mid);

-- Index on vid
CREATE INDEX idx_sb_vid
ON registry.sb (vid);

CREATE INDEX IF NOT EXISTS idx_sb_vid_isd
ON registry.sb (vid,isd);

-- Index on mid
CREATE INDEX IF NOT EXISTS idx_sb_mid
ON registry.sb (mid);

CREATE INDEX IF NOT EXISTS idx_sb_mid_isd
ON registry.sb (mid, isd);

-- Index on bid
CREATE INDEX IF NOT EXISTS idx_sb_bid
ON registry.sb (bid);

CREATE INDEX IF NOT EXISTS idx_sb_bid_isd
ON registry.sb (bid, isd);

-- Index on brid
CREATE INDEX IF NOT EXISTS idx_sb_brid
ON registry.sb (brid);

CREATE INDEX IF NOT EXISTS idx_sb_brid_isd
ON registry.sb (brid, isd);


----------------------------VPA INDEXS

CREATE INDEX IF NOT EXISTS idx_vpa_vpa
ON registry.vpa (vpa);

CREATE INDEX IF NOT EXISTS idx_vpa_vpa_isd
ON registry.vpa (vpa, isd);

CREATE INDEX IF NOT EXISTS idx_vpa_bid
ON registry.vpa (bid);

CREATE INDEX IF NOT EXISTS idx_vpa_bid_isd
ON registry.vpa (bid, isd);


---------------------BANK INDEXES

CREATE INDEX IF NOT EXISTS idx_banks_bname
ON registry.banks (bname);

CREATE INDEX IF NOT EXISTS idx_banks_bname_isd
ON registry.banks (bname, isd);


----------------------BRANCH INDEXES

CREATE INDEX IF NOT EXISTS idx_branches_brname
ON registry.branches (brname);



CREATE INDEX IF NOT EXISTS idx_branches_bid
ON registry.branches (bid);


---------------------DEVICES INDEXES

CREATE INDEX IF NOT EXISTS idx_devices_dname
ON registry.devices (dname);

CREATE INDEX IF NOT EXISTS idx_devices_mfid
ON registry.devices (mfid);

CREATE INDEX IF NOT EXISTS idx_devices_fid
ON registry.devices (fid);

CREATE INDEX IF NOT EXISTS idx_devices_mdid
ON registry.devices (mdid);





--------------------MERCHANTS INDEXES

CREATE INDEX IF NOT EXISTS idx_merchants_mname
ON registry.merchants (mname);

CREATE INDEX IF NOT EXISTS idx_merchants_bid
ON registry.merchants (bid);



-----------------------FIRMWARE INDEXES

CREATE INDEX IF NOT EXISTS idx_firmware_fname
ON registry.firmware (fname);

CREATE INDEX IF NOT EXISTS idx_firmware_mfid
ON registry.firmware (mfid);

CREATE INDEX IF NOT EXISTS idx_firmware_
ON registry.firmware (fname);


-----------------------MF INDEXES

CREATE INDEX IF NOT EXISTS idx_mf_mfname
ON registry.mf (mfname);

-----------------------MODELS INDEXES

CREATE INDEX IF NOT EXISTS idx_model_mfid
ON registry.model (mfid);

CREATE INDEX IF NOT EXISTS idx_model_fid
ON registry.model (fid);

CREATE INDEX IF NOT EXISTS idx_model_mdname
ON registry.model (mdname);

-----------policies indexes------------
CREATE INDEX IF NOT EXISTS idx_policies_policy_name
ON registry.policies(policy_name);


-------routes indexes-------
CREATE INDEX IF NOT EXISTS idx_routes_rname
ON registry.routes(rname);


-------sbroutes indexes-------

CREATE INDEX IF NOT EXISTS idx_sbroutes_rid
ON registry.sbroutes(rid);

CREATE INDEX IF NOT EXISTS idx_sbroutes_did
ON registry.sbroutes(did);

CREATE INDEX IF NOT EXISTS idx_sbroutes_did_rid
ON registry.sbroutes(did,rid);
