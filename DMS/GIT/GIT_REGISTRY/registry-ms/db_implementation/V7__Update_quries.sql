CREATE OR REPLACE FUNCTION registry.merchants_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO registry.merchants_v (mid, msid, mname, minfo, bid, mevt, eid, brid, isd, eat, eby, op)
    VALUES (NEW.mpid,  NEW.msid, NEW.mname, NEW.minfo, NEW.bid, NEW.mevt, NEW.eid, NEW.brid, NEW.isd, NEW.eat, NEW.eby, 'CREATED');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.isd = true AND OLD.isd = false THEN
      INSERT INTO registry.merchants_v (mid,  msid, mname, minfo, bid, mevt, eid, brid, isd, eat, eby, op)
      VALUES (NEW.mpid,  NEW.msid, NEW.mname, NEW.minfo, NEW.bid, NEW.mevt, NEW.eid, NEW.brid, NEW.isd, NEW.eat, NEW.eby, 'DELETED');
    ELSE
      INSERT INTO registry.merchants_v (mid,  msid, mname, minfo, bid, mevt, eid, brid, isd, eat, eby, op)
      VALUES (NEW.mpid,  NEW.msid, NEW.mname, NEW.minfo, NEW.bid, NEW.mevt, NEW.eid, NEW.brid, NEW.isd, NEW.eat, NEW.eby, 'UPDATED');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

