CREATE OR REPLACE FUNCTION workflow.update_wfalog_status(
  in_eid INTEGER,
  in_lid INTEGER,
  in_aid INTEGER,
  in_peid INTEGER DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  _ischainable BOOLEAN;
  _is_final BOOLEAN;
  _child_final_status TEXT;
  _status workflow.alogstatus;
BEGIN
  -- 1. Get chainable flag
  SELECT ischainable INTO _ischainable 
  FROM workflow.actions 
  WHERE aid = in_aid;

  -- 2. Determine current astatus based on ischainable
  IF _ischainable THEN
    IF (
      SELECT COUNT(*) FROM workflow.wfhlog 
      WHERE eid = in_eid AND hstatus = 'PROCESSED'
    ) = (
      SELECT COUNT(*) FROM workflow.wfhlog 
      WHERE eid = in_eid
    ) THEN
      _status := 'PROCESSING';

    ELSIF (
      SELECT COUNT(*) FROM workflow.wfhlog 
      WHERE eid = in_eid AND hstatus = 'FAILURE'
    ) > 0 THEN
      _status := 'FAILURE';

    ELSE
      _status := 'PROCESSING';
    END IF;

  ELSE
    IF (
      SELECT COUNT(*) FROM workflow.wfhlog 
      WHERE eid = in_eid AND hstatus = 'PROCESSED'
    ) = (
      SELECT COUNT(*) FROM workflow.wfhlog 
      WHERE eid = in_eid
    ) THEN
      _status := 'PROCESSED';

    ELSIF (
      SELECT COUNT(*) FROM workflow.wfhlog 
      WHERE eid = in_eid AND hstatus = 'FAILURE'
    ) > 0 THEN
      _status := 'FAILURE';

    ELSIF (
      SELECT COUNT(*) FROM workflow.wfhlog 
      WHERE eid = in_eid AND hstatus = 'PROCESSING'
    ) > 0 THEN
      _status := 'PROCESSING';

    ELSE
      _status := 'PROCESSING';
    END IF;
  END IF;

  -- 3. Update current action log
  UPDATE workflow.wfalog 
  SET astatus = _status
  WHERE lid = in_lid;

  -- 4. Optional: update parent status if this child is final and passed
  IF in_peid IS NOT NULL THEN
    -- Check if this aid is final in the chain
    SELECT is_final_status INTO _is_final 
    FROM workflow.chainable 
    WHERE aid = in_aid;

    IF _is_final THEN
      -- Get latest child hstatus
      SELECT hstatus INTO _child_final_status
      FROM workflow.wfhlog 
      WHERE eid = in_eid
      ORDER BY created_at DESC NULLS LAST
      LIMIT 1;

      IF _child_final_status = 'PROCESSED' THEN
        UPDATE workflow.wfalog
        SET astatus = 'PROCESSED'
        WHERE eid = in_peid;
      ELSE
        UPDATE workflow.wfalog
        SET astatus = 'PROCESSING'
        WHERE eid = in_peid;
      END IF;
    END IF;
  END IF;

END;
$$ LANGUAGE plpgsql;
