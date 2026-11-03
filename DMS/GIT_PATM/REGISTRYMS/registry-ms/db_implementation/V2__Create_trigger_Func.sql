--banks

CREATE OR REPLACE FUNCTION registry.banks_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO registry.banks_v (bid, bname, bevt, eid, isd, eat, eby, op)
    VALUES (NEW.bid,  NEW.bname, NEW.bevt, NEW.eid, NEW.isd, NEW.eat, NEW.eby, 'CREATED');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.isd = true AND OLD.isd = false THEN
      INSERT INTO registry.banks_v (bid, bname, bevt, eid, isd, eat, eby, op)
      VALUES (NEW.bid,  NEW.bname, NEW.bevt, NEW.eid, NEW.isd, NEW.eat, NEW.eby, 'DELETED');
    ELSE
      INSERT INTO registry.banks_v (bid, bname, bevt, eid, isd, eat, eby, op)
      VALUES (NEW.bid,  NEW.bname, NEW.bevt, NEW.eid, NEW.isd, NEW.eat, NEW.eby, 'UPDATED');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER banks_trigger
AFTER INSERT OR UPDATE ON registry.banks
FOR EACH ROW
EXECUTE FUNCTION registry.banks_trigger_function();


-----branches-------------
CREATE OR REPLACE FUNCTION registry.branches_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO registry.branches_v (brid, brname, braddr, bid, brevt, eid, isd, eat, eby, op)
    VALUES (NEW.brid, NEW.brname, NEW.braddr, NEW.bid, NEW.brevt, NEW.eid, NEW.isd, NEW.eat, NEW.eby, 'CREATED');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.isd = true AND OLD.isd = false THEN
      INSERT INTO registry.branches_v (brid, brname, braddr, bid, brevt, eid, isd, eat, eby, op)
      VALUES (NEW.brid, NEW.brname, NEW.braddr, NEW.bid, NEW.brevt, NEW.eid, NEW.isd, NEW.eat, NEW.eby, 'DELETED');
    ELSE
      INSERT INTO registry.branches_v (brid, brname, braddr, bid, brevt, eid, isd, eat, eby, op)
      VALUES (NEW.brid, NEW.brname, NEW.braddr, NEW.bid, NEW.brevt, NEW.eid, NEW.isd, NEW.eat, NEW.eby, 'UPDATED');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER branches_trigger
AFTER INSERT OR UPDATE ON registry.branches
FOR EACH ROW
EXECUTE FUNCTION registry.branches_trigger_function();


---------------devices-----------
CREATE OR REPLACE FUNCTION registry.devices_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO registry.devices_v (did, dname, mfid, fid, mdid, devt, eid, isd, eat, eby, op)
    VALUES (NEW.did, NEW.dname, NEW.mfid, NEW.fid, NEW.mdid, NEW.devt, NEW.eid, NEW.isd, NEW.eat, NEW.eby, 'CREATED');
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

CREATE TRIGGER devices_trigger
AFTER INSERT OR UPDATE ON registry.devices
FOR EACH ROW
EXECUTE FUNCTION registry.devices_trigger_function();

-----firmware-----------

CREATE OR REPLACE FUNCTION registry.firmware_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO registry.firmware_v (fid, mfid, fname, frevt, eid, eat, eby, isd, op)
    VALUES (NEW.fid, NEW.mfid, NEW.fname, NEW.frevt, NEW.eid, NEW.eat, NEW.eby, NEW.isd, 'CREATED');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.isd = true AND OLD.isd = false THEN
      INSERT INTO registry.firmware_v (fid, mfid, fname, frevt, eid, eat, eby, isd, op)
      VALUES (NEW.fid, NEW.mfid, NEW.fname, NEW.frevt, NEW.eid, NEW.eat, NEW.eby, NEW.isd, 'DELETED');
    ELSE
      INSERT INTO registry.firmware_v (fid, mfid, fname, frevt, eid, eat, eby, isd, op)
      VALUES (NEW.fid, NEW.mfid, NEW.fname, NEW.frevt, NEW.eid, NEW.eat, NEW.eby, NEW.isd, 'UPDATED');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER firmware_trigger
AFTER INSERT OR UPDATE ON registry.firmware
FOR EACH ROW
EXECUTE FUNCTION registry.firmware_trigger_function();

------merchants---------------

CREATE OR REPLACE FUNCTION registry.merchants_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO registry.merchants_v (mpid, msid, mname, minfo, bid, mevt, eid, brid, isd, eat, eby, op)
    VALUES (NEW.mpid,  NEW.msid, NEW.mname, NEW.minfo, NEW.bid, NEW.mevt, NEW.eid, NEW.brid, NEW.isd, NEW.eat, NEW.eby, 'CREATED');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.isd = true AND OLD.isd = false THEN
      INSERT INTO registry.merchants_v (mpid,  msid, mname, minfo, bid, mevt, eid, brid, isd, eat, eby, op)
      VALUES (NEW.mpid,  NEW.msid, NEW.mname, NEW.minfo, NEW.bid, NEW.mevt, NEW.eid, NEW.brid, NEW.isd, NEW.eat, NEW.eby, 'DELETED');
    ELSE
      INSERT INTO registry.merchants_v (mpid,  msid, mname, minfo, bid, mevt, eid, brid, isd, eat, eby, op)
      VALUES (NEW.mpid,  NEW.msid, NEW.mname, NEW.minfo, NEW.bid, NEW.mevt, NEW.eid, NEW.brid, NEW.isd, NEW.eat, NEW.eby, 'UPDATED');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER merchants_trigger
AFTER INSERT OR UPDATE ON registry.merchants
FOR EACH ROW
EXECUTE FUNCTION registry.merchants_trigger_function();


---------------------mf----------------------------

CREATE OR REPLACE FUNCTION registry.mf_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO registry.mf_v (mfid, mfname, mfevt, mfinfo, mfaddr, eid, eat, eby, isd, op)
    VALUES (NEW.mfid, NEW.mfname, NEW.mfevt, NEW.mfinfo, NEW.mfaddr, NEW.eid, NEW.eat, NEW.eby, NEW.isd, 'CREATED');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.isd = true AND OLD.isd = false THEN
      INSERT INTO registry.mf_v (mfid, mfname, mfevt, mfinfo, mfaddr, eid, eat, eby, isd, op)
      VALUES (NEW.mfid, NEW.mfname, NEW.mfevt, NEW.mfinfo, NEW.mfaddr, NEW.eid, NEW.eat, NEW.eby, NEW.isd, 'DELETED');
    ELSE
      INSERT INTO registry.mf_v (mfid, mfname, mfevt, mfinfo, mfaddr, eid, eat, eby, isd, op)
      VALUES (NEW.mfid, NEW.mfname, NEW.mfevt, NEW.mfinfo, NEW.mfaddr, NEW.eid, NEW.eat, NEW.eby, NEW.isd, 'UPDATED');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mf_trigger
AFTER INSERT OR UPDATE ON registry.mf
FOR EACH ROW
EXECUTE FUNCTION registry.mf_trigger_function();




---------------Model---------------

CREATE OR REPLACE FUNCTION registry.model_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO registry.model_v (mdid, mfid, fid, mdevt, eid, mdname, eat, eby, isd, op)
    VALUES (NEW.mdid, NEW.mfid, NEW.fid, NEW.mdevt, NEW.eid, NEW.mdname, NEW.eat, NEW.eby, NEW.isd, 'CREATED');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.isd = true AND OLD.isd = false THEN
      INSERT INTO registry.model_v (mdid, mfid, fid, mdevt, eid, mdname, eat, eby, isd, op)
      VALUES (NEW.mdid, NEW.mfid, NEW.fid, NEW.mdevt, NEW.eid, NEW.mdname, NEW.eat, NEW.eby, NEW.isd, 'DELETED');
    ELSE
      INSERT INTO registry.model_v (mdid, mfid, fid, mdevt, eid, mdname, eat, eby, isd, op)
      VALUES (NEW.mdid, NEW.mfid, NEW.fid, NEW.mdevt, NEW.eid, NEW.mdname, NEW.eat, NEW.eby, NEW.isd, 'UPDATED');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER model_trigger
AFTER INSERT OR UPDATE ON registry.model
FOR EACH ROW
EXECUTE FUNCTION registry.model_trigger_function();

---------------sb----------
CREATE OR REPLACE FUNCTION registry.sb_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO registry.sb_v (sid, vid, mid, did, bid, brid, sbevt, eid, isd, eat, eby, op)
    VALUES (NEW.sid, NEW.vid, NEW.mid, NEW.did, NEW.bid, NEW.brid, NEW.sbevt, NEW.eid, NEW.isd, NEW.eat, NEW.eby, 'CREATED');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.isd = true AND OLD.isd = false THEN
      INSERT INTO registry.sb_v (sid, vid, mid, did, bid, brid, sbevt, eid, isd, eat, eby, op)
      VALUES (NEW.sid, NEW.vid, NEW.mid, NEW.did, NEW.bid, NEW.brid, NEW.sbevt, NEW.eid, NEW.isd, NEW.eat, NEW.eby, 'DELETED');
    ELSE
      INSERT INTO registry.sb_v (sid, vid, mid, did, bid, brid, sbevt, eid, isd, eat, eby, op)
      VALUES (NEW.sid, NEW.vid, NEW.mid, NEW.did, NEW.bid, NEW.brid, NEW.sbevt, NEW.eid, NEW.isd, NEW.eat, NEW.eby, 'UPDATED');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sb_trigger
AFTER INSERT OR UPDATE ON registry.sb
FOR EACH ROW
EXECUTE FUNCTION registry.sb_trigger_function();


--------VPA----------

CREATE OR REPLACE FUNCTION registry.vpa_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO registry.vpa_v (vid, vpa, vevt, eid, eat, eby, isd, op)
    VALUES (NEW.vid, NEW.vpa, NEW.vevt, NEW.eid, NEW.eat, NEW.eby, NEW.isd, 'CREATED');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.isd = true AND OLD.isd = false THEN
      INSERT INTO registry.vpa_v (vid, vpa, vevt, eid, eat, eby, isd, op)
      VALUES (NEW.vid, NEW.vpa, NEW.vevt, NEW.eid, NEW.eat, NEW.eby, NEW.isd, 'DELETED');
    ELSE
      INSERT INTO registry.vpa_v (vid, vpa, vevt, eid, eat, eby, isd, op)
      VALUES (NEW.vid, NEW.vpa, NEW.vevt, NEW.eid, NEW.eat, NEW.eby, NEW.isd, 'UPDATED');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vpa_trigger
AFTER INSERT OR UPDATE ON registry.vpa
FOR EACH ROW
EXECUTE FUNCTION registry.vpa_trigger_function();
