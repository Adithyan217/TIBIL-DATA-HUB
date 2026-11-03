-----------------------DEVICES VERSION-----------------


CREATE TABLE IF NOT EXISTS intel.m_devices_v (
  v_id SERIAL PRIMARY KEY,
  bid INT,
  brid INT,
  bdcount INT DEFAULT 0,
  brdcount INT DEFAULT 0,
  mdcount INT DEFAULT 0,
  incount INT DEFAULT 0,
  ddcount INT DEFAULT 0,
  op TEXT,  -- 'INSERT' or 'UPDATE'
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE OR REPLACE FUNCTION intel.log_m_devices_version()
RETURNS TRIGGER AS $$
DECLARE
  bd INT := 0;
  brd INT := 0;
  md INT := 0;
  inc INT := 0;
  dd INT := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    bd := NEW.bdcount;
    brd := NEW.brdcount;
    md := NEW.mdcount;
    inc := NEW.incount;
    dd := NEW.ddcount;

  ELSIF TG_OP = 'UPDATE' THEN
    bd := CASE WHEN NEW.bdcount - OLD.bdcount = 1 THEN 1 ELSE 0 END;
    brd := CASE WHEN NEW.brdcount - OLD.brdcount = 1 THEN 1 ELSE 0 END;
    md := CASE WHEN NEW.mdcount - OLD.mdcount = 1 THEN 1 ELSE 0 END;
    inc := CASE WHEN NEW.incount - OLD.incount = 1 THEN 1 ELSE 0 END;
    dd := CASE WHEN NEW.ddcount - OLD.ddcount = 1 THEN 1 ELSE 0 END;
  END IF;

  INSERT INTO intel.m_devices_v (
    bid, brid, bdcount, brdcount, mdcount, incount, ddcount, op, eat
  ) VALUES (
    NEW.bid, NEW.brid, bd, brd, md, inc, dd, TG_OP, CURRENT_TIMESTAMP
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_m_devices_version
AFTER INSERT OR UPDATE ON intel.m_devices
FOR EACH ROW
EXECUTE FUNCTION intel.log_m_devices_version();



---------------------------------DEVICES ISSUES---------------------

CREATE TABLE IF NOT EXISTS intel.m_device_issues_v (
  v_id SERIAL PRIMARY KEY,
  bid INT,
  brid INT,
  opencount INT DEFAULT 0,
  closedcount INT DEFAULT 0,
  op TEXT,  -- 'INSERT' or 'UPDATE'
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION intel.log_m_device_issues_version()
RETURNS TRIGGER AS $$
DECLARE
  open_delta INT := 0;
  closed_delta INT := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    open_delta := NEW.opencount;
    closed_delta := NEW.closedcount;

  ELSIF TG_OP = 'UPDATE' THEN
    open_delta := CASE WHEN NEW.opencount - OLD.opencount = 1 THEN 1 ELSE 0 END;
    closed_delta := CASE WHEN NEW.closedcount - OLD.closedcount = 1 THEN 1 ELSE 0 END;
  END IF;

  INSERT INTO intel.m_device_issues_v (
    bid, brid, opencount, closedcount, op, eat
  ) VALUES (
    NEW.bid, NEW.brid, open_delta, closed_delta, TG_OP, CURRENT_TIMESTAMP
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_m_device_issues_version
AFTER INSERT OR UPDATE ON intel.m_device_issues
FOR EACH ROW
EXECUTE FUNCTION intel.log_m_device_issues_version();




-----------------------------DEVICE REQUESTS-------------------
CREATE TABLE IF NOT EXISTS intel.m_device_request_v (
  v_id SERIAL PRIMARY KEY,
  bid INT,
  brid INT,
  opencount INT DEFAULT 0,
  closedcount INT DEFAULT 0,
  op TEXT,  -- 'INSERT' or 'UPDATE'
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION intel.log_m_device_request_version()
RETURNS TRIGGER AS $$
DECLARE
  open_delta INT := 0;
  closed_delta INT := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    open_delta := NEW.opencount;
    closed_delta := NEW.closedcount;

  ELSIF TG_OP = 'UPDATE' THEN
    open_delta := CASE WHEN NEW.opencount - OLD.opencount = 1 THEN 1 ELSE 0 END;
    closed_delta := CASE WHEN NEW.closedcount - OLD.closedcount = 1 THEN 1 ELSE 0 END;
  END IF;

  INSERT INTO intel.m_device_request_v (
    bid, brid, opencount, closedcount, op, eat
  ) VALUES (
    NEW.bid, NEW.brid, open_delta, closed_delta, TG_OP, CURRENT_TIMESTAMP
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_m_device_request_version
AFTER INSERT OR UPDATE ON intel.m_device_request
FOR EACH ROW
EXECUTE FUNCTION intel.log_m_device_request_version();


