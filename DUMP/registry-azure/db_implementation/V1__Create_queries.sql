
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



