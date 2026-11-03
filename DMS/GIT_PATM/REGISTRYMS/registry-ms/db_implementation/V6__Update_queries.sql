
----update table vpa - set bid as not null
ALTER TABLE registry.vpa ALTER COLUMN bid SET NOT NULL;

-----update enum
ALTER TYPE registry.sbevts ADD VALUE 'DEVICE_ONBOARDED';
ALTER TYPE registry.sbevts ADD VALUE 'DEVICE_DEACTIVATED';
ALTER TYPE registry.sbevts ADD VALUE 'VPA_DEACTIVATED';
ALTER TYPE registry.sbevts ADD VALUE 'BANK_DEACTIVATED';

-----update trigger function
CREATE OR REPLACE FUNCTION registry.devices_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO registry.devices_v (did, dname, mfid, fid, mdid, devt, eid, isd, eat, eby, op)
    VALUES (NEW.did, NEW.dname, NEW.mfid, NEW.fid, NEW.mdid, NEW.devt, NEW.eid, NEW.isd, NEW.eat, NEW.eby, 'CREATED');
	INSERT INTO registry.sb(did,sbevt,eid,isd, eat, eby)
	VALUES (NEW.did,'DEVICE_ONBOARDED',NEW.eid, NEW.isd, NEW.eat, NEW.eby);
  
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.isd = true AND OLD.isd = false THEN
      INSERT INTO registry.devices_v (did, dname, mfid, fid, mdid, devt, eid, isd, eat, eby, op)
      VALUES (NEW.did, NEW.dname, NEW.mfid, NEW.fid, NEW.mdid, NEW.devt, NEW.eid, NEW.isd, NEW.eat, NEW.eby, 'DELETED');
    ELSE
      INSERT INTO registry.devices_v (did, dname, mfid, fid, mdid, devt, eid, isd, eat, eby, op)
      VALUES (NEW.did, NEW.dname, NEW.mfid, NEW.fid, NEW.mdid, NEW.devt, NEW.eid, NEW.isd, NEW.eat, NEW.eby, 'UPDATED');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-----update primary key of version tables
DROP TABLE registry.sb_v;
DROP TABLE registry.devices_v;
DROP TABLE registry.firmware_v;
DROP TABLE registry.model_v;

CREATE TABLE IF NOT EXISTS registry.firmware_v (
  pid SERIAL PRIMARY KEY,
  fid INTEGER,
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
  pid SERIAL PRIMARY KEY,
  mdid INTEGER,
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
  pid SERIAL PRIMARY KEY,
  did INTEGER ,
  dname VARCHAR ,
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

ALTER TABLE registry.banks_v ADD COLUMN pid SERIAL;
ALTER TABLE registry.banks_v ADD CONSTRAINT banks_v_pkey PRIMARY KEY (pid);

ALTER TABLE registry.branches_v ADD COLUMN pid SERIAL;
ALTER TABLE registry.branches_v ADD CONSTRAINT branches_v_pkey PRIMARY KEY (pid);

ALTER TABLE registry.merchants_v ADD COLUMN pid SERIAL;
ALTER TABLE registry.merchants_v ADD CONSTRAINT merchants_v_pkey PRIMARY KEY (pid);

ALTER TABLE registry.mf_v ADD COLUMN pid SERIAL;
ALTER TABLE registry.mf_v ADD CONSTRAINT mf_v_pkey PRIMARY KEY (pid);

ALTER TABLE registry.vpa_v ADD COLUMN pid SERIAL;
ALTER TABLE registry.vpa_v ADD CONSTRAINT vpa_v_pkey PRIMARY KEY (pid);

