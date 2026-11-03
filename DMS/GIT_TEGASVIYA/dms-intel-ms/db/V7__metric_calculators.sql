-- -----------------------------------------------DEVICE CALCULATORS-------------------------------------------

CREATE OR REPLACE FUNCTION intel.mc_incount_incrementer()
RETURNS INT AS $$
BEGIN
  BEGIN
    INSERT INTO intel.m_devices (bid, brid, bdcount, brdcount, mdcount, incount, eat)
    VALUES (0, 0, 0, 0, 0, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (bid, brid) DO
    UPDATE SET incount = COALESCE(intel.m_devices.incount, 0) + 1, eat = CURRENT_TIMESTAMP;
    RETURN 1;  -- Success

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in execution: %', SQLERRM;
    RETURN 0;  -- Failure
  END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mc_incount_decrementer()
RETURNS INT AS $$
BEGIN
  BEGIN
    UPDATE intel.m_devices
    SET incount = COALESCE(incount, 0) - 1, eat = CURRENT_TIMESTAMP
    WHERE bid = 0 AND brid = 0;
    RETURN 1;  -- Success

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in execution: %', SQLERRM;
    RETURN 0;  -- Failure
  END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mc_bdcount_incrementer(p_bid INT)
RETURNS INT AS $$
BEGIN
  BEGIN
    INSERT INTO intel.m_devices (bid, brid, bdcount, brdcount, mdcount, incount, eat)
    VALUES (p_bid, 0, 1, 0, 0, 0, CURRENT_TIMESTAMP)
    ON CONFLICT (bid, brid) DO
    UPDATE SET bdcount = COALESCE(intel.m_devices.bdcount, 0) + 1, eat = CURRENT_TIMESTAMP;
    RETURN 1;  -- Success

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in execution: %', SQLERRM;
    RETURN 0;  -- Failure
  END;
END;
$$ LANGUAGE plpgsql;

SELECT intel.mc_bdcount_incrementer(1);


CREATE OR REPLACE FUNCTION intel.mc_bdcount_decrementer(p_bid INT)
RETURNS INT AS $$
BEGIN
  BEGIN
    UPDATE intel.m_devices
    SET bdcount = COALESCE(bdcount, 0) - 1, eat = CURRENT_TIMESTAMP
    WHERE bid = p_bid AND brid = 0;
    RETURN 1;  -- Success

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in execution: %', SQLERRM;
    RETURN 0;  -- Failure
  END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mc_brdcount_incrementer(p_bid INT, p_brid INT)
RETURNS INT AS $$
BEGIN
  BEGIN
    INSERT INTO intel.m_devices (bid, brid, bdcount, brdcount, mdcount, incount, eat)
    VALUES (p_bid, p_brid, 0, 1, 0, 0, CURRENT_TIMESTAMP)
    ON CONFLICT (bid, brid) DO
    UPDATE SET brdcount = COALESCE(intel.m_devices.brdcount, 0) + 1, eat = CURRENT_TIMESTAMP;
    RETURN 1;  -- Success

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in execution: %', SQLERRM;
    RETURN 0;  -- Failure
  END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mc_brdcount_decrementer(p_bid INT, p_brid INT)
RETURNS INT AS $$
BEGIN
  BEGIN
    UPDATE intel.m_devices
    SET brdcount = COALESCE(brdcount, 0) - 1, eat = CURRENT_TIMESTAMP
    WHERE bid = p_bid AND brid = p_brid;
    RETURN 1;  -- Success

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in execution: %', SQLERRM;
    RETURN 0;  -- Failure
  END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mc_mdcount_incrementer(p_bid INT, p_brid INT)
RETURNS INT AS $$
BEGIN
  BEGIN
    INSERT INTO intel.m_devices (bid, brid, bdcount, brdcount, mdcount, incount, eat)
    VALUES (p_bid, p_brid, 0, 0, 1, 0, CURRENT_TIMESTAMP)
    ON CONFLICT (bid, brid) DO
    UPDATE SET mdcount = COALESCE(intel.m_devices.mdcount, 0) + 1, eat = CURRENT_TIMESTAMP;
    RETURN 1;  -- Success

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in execution: %', SQLERRM;
    RETURN 0;  -- Failure
  END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mc_mdcount_decrementer(p_bid INT, p_brid INT)
RETURNS INT AS $$
BEGIN
  BEGIN
    UPDATE intel.m_devices
    SET mdcount = COALESCE(mdcount, 0) - 1, eat = CURRENT_TIMESTAMP
    WHERE bid = p_bid AND brid = p_brid;
    RETURN 1;  -- Success

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in execution: %', SQLERRM;
    RETURN 0;  -- Failure
  END;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------BANK METRIC CALCULATORS-----------------------------------------

CREATE OR REPLACE FUNCTION intel.mc_bank_incrementer(p_bid INT)
RETURNS INT AS $$
BEGIN
  BEGIN
    INSERT INTO intel.m_banks (bid, eat)
    VALUES (p_bid, CURRENT_TIMESTAMP);
    RETURN 1;  -- Success

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in execution: %', SQLERRM;
    RETURN 0;  -- Failure
  END;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------BRANCH METRIC CALCULATOR---------------------------------------------

CREATE OR REPLACE FUNCTION intel.mc_branch_incrementer(p_bid INT, p_brid INT)
RETURNS INT AS $$
BEGIN
  BEGIN
    INSERT INTO intel.m_branches (bid, brid, eat)
    VALUES (p_bid, p_brid, CURRENT_TIMESTAMP);
    RETURN 1;  -- Success

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in execution: %', SQLERRM;
    RETURN 0;  -- Failure
  END;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------MERCHANT METRIC CALCULATORS---------------------------------------------

CREATE OR REPLACE FUNCTION intel.mc_merchant_incrementer(p_bid INT, p_brid INT)
RETURNS INT AS $$
BEGIN
  BEGIN
    INSERT INTO intel.m_merchants (bid, brid, mcount, eat)
    VALUES (p_bid, p_brid, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (bid, brid) DO
    UPDATE SET mcount = COALESCE(intel.m_merchants.mcount, 0) + 1, eat = CURRENT_TIMESTAMP;
    RETURN 1;  -- Success

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in execution: %', SQLERRM;
    RETURN 0;  -- Failure
  END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mc_merchant_decrementer(p_bid INT, p_brid INT)
RETURNS INT AS $$
BEGIN
  BEGIN
    UPDATE intel.m_merchants
    SET mcount = COALESCE(mcount, 0) - 1, eat = CURRENT_TIMESTAMP
    WHERE bid = p_bid AND brid = p_brid;
    RETURN 1;  -- Success

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in execution: %', SQLERRM;
    RETURN 0;  -- Failure
  END;
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------DEVICE ISSUES METRIC CALCULATORS---------------------------------------------

CREATE OR REPLACE FUNCTION intel.mc_di_open_incrementer(p_bid INT, p_brid INT)
RETURNS INT AS $$
BEGIN
  BEGIN
    INSERT INTO intel.m_device_issues (bid, brid, opencount, closedcount, eat)
    VALUES (p_bid, p_brid, 1, 0, CURRENT_TIMESTAMP)
    ON CONFLICT (bid, brid) DO
    UPDATE SET opencount = COALESCE(intel.m_device_issues.opencount, 0) + 1, eat = CURRENT_TIMESTAMP;
    RETURN 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in execution: %', SQLERRM;
    RETURN 0;
  END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mc_di_open_decrementer(p_bid INT, p_brid INT)
RETURNS INT AS $$
BEGIN
  BEGIN
    UPDATE intel.m_device_issues
    SET opencount = COALESCE(opencount, 0) - 1, eat = CURRENT_TIMESTAMP
    WHERE bid = p_bid AND brid = p_brid;
    RETURN 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in execution: %', SQLERRM;
    RETURN 0;
  END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mc_di_closed_incrementer(p_bid INT, p_brid INT)
RETURNS INT AS $$
BEGIN
  BEGIN
    INSERT INTO intel.m_device_issues (bid, brid, opencount, closedcount, eat)
    VALUES (p_bid, p_brid, 0, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (bid, brid) DO
    UPDATE SET closedcount = COALESCE(intel.m_device_issues.closedcount, 0) + 1, eat = CURRENT_TIMESTAMP;
    RETURN 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in execution: %', SQLERRM;
    RETURN 0;
  END;
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------DEVICE REQUESTS METRIC CALCULATORS---------------------------------------------

CREATE OR REPLACE FUNCTION intel.mc_dr_open_incrementer(p_bid INT, p_brid INT)
RETURNS INT AS $$
BEGIN
  BEGIN
    INSERT INTO intel.m_device_request (bid, brid, opencount, closedcount, eat)
    VALUES (p_bid, p_brid, 1, 0, CURRENT_TIMESTAMP)
    ON CONFLICT (bid, brid) DO
    UPDATE SET opencount = COALESCE(intel.m_device_request.opencount, 0) + 1, eat = CURRENT_TIMESTAMP;
    RETURN 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in execution: %', SQLERRM;
    RETURN 0;
  END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mc_dr_open_decrementer(p_bid INT, p_brid INT)
RETURNS INT AS $$
BEGIN
  BEGIN
    UPDATE intel.m_device_request
    SET opencount = COALESCE(opencount, 0) - 1, eat = CURRENT_TIMESTAMP
    WHERE bid = p_bid AND brid = p_brid;
    RETURN 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in execution: %', SQLERRM;
    RETURN 0;
  END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mc_dr_closed_incrementer(p_bid INT, p_brid INT)
RETURNS INT AS $$
BEGIN
  BEGIN
    INSERT INTO intel.m_device_request (bid, brid, opencount, closedcount, eat)
    VALUES (p_bid, p_brid, 0, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (bid, brid) DO
    UPDATE SET closedcount = COALESCE(intel.m_device_request.closedcount, 0) + 1, eat = CURRENT_TIMESTAMP;
    RETURN 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in execution: %', SQLERRM;
    RETURN 0;
  END;
END;
$$ LANGUAGE plpgsql;



-----------------------------------------PAYMENTS CALCULATOR------------------------
CREATE OR REPLACE FUNCTION intel.mc_payments_incrementer(
  p_bid INT,
  p_brid INT,
  p_imei TEXT,
  p_amt NUMERIC
)
RETURNS INT AS $$
BEGIN
  BEGIN
    -- Try insert first
    INSERT INTO intel.m_payments_daily (bid, brid, imei, pcount, ptotal, eat)
    VALUES (p_bid, p_brid, p_imei, 1, p_amt, CURRENT_DATE);

    RETURN 1;  -- Success on insert

  EXCEPTION WHEN unique_violation THEN
    -- If conflict, fallback to update
    UPDATE intel.m_payments_daily
    SET pcount = pcount + 1,
        ptotal = ptotal + p_amt,
        eat = CURRENT_DATE
    WHERE bid = p_bid AND brid = p_brid AND imei = p_imei AND eat = CURRENT_DATE;

    RETURN 1;  -- Success on update

  WHEN OTHERS THEN
    -- Log and return failure
    RAISE NOTICE 'Error in mc_payments_incrementer: %', SQLERRM;
    RETURN 0;
  END;
END;
$$ LANGUAGE plpgsql;


-----OPTION @
-- CREATE OR REPLACE FUNCTION intel.mc_payments_incrementer(
--   p_bid INT,
--   p_brid INT,
--   p_imei TEXT,
--   p_amt NUMERIC
-- )
-- RETURNS INT AS $$
-- DECLARE
--   updated INT;
-- BEGIN
--   BEGIN
--     -- Attempt to update first
--     UPDATE intel.m_payments_daily
--     SET pcount = pcount + 1,
--         ptotal = ptotal + p_amt,
--         eat = CURRENT_DATE
--     WHERE bid = p_bid AND brid = p_brid AND imei = p_imei AND eat = CURRENT_DATE;

--     GET DIAGNOSTICS updated = ROW_COUNT;

--     -- If no row updated, try inserting
--     IF updated = 0 THEN
--       BEGIN
--         INSERT INTO intel.m_payments_daily (bid, brid, imei, pcount, ptotal, eat)
--         VALUES (p_bid, p_brid, p_imei, 1, p_amt, CURRENT_DATE);
--       EXCEPTION WHEN unique_violation THEN
--         -- Another process inserted it; retry update
--         UPDATE intel.m_payments_daily
--         SET pcount = pcount + 1,
--             ptotal = ptotal + p_amt,
--             eat = CURRENT_DATE
--         WHERE bid = p_bid AND brid = p_brid AND imei = p_imei AND eat = CURRENT_DATE;
--       END;
--     END IF;

--     RETURN 1;  -- Success

--   EXCEPTION WHEN OTHERS THEN
--     RAISE NOTICE 'Error in mc_payments_incrementer: %', SQLERRM;
--     RETURN 0;  -- Failure
--   END;
-- END;
-- $$ LANGUAGE plpgsql;


----------------------------------DEACTIVATE_DEVICE
CREATE OR REPLACE FUNCTION intel.mc_ddcount_incrementer(
    p_bid INT,
    p_brid INT,
    p_last_action registry.sbevts
)
RETURNS INT AS
$$
BEGIN
  BEGIN
    CASE p_last_action
      WHEN 'ALLOCATED_TO_BANK' THEN
        UPDATE intel.m_devices
        SET bdcount = GREATEST(COALESCE(bdcount, 0) - 1, 0),
            ddcount = COALESCE(ddcount, 0) + 1
        WHERE bid = p_bid AND brid = 0;

      WHEN 'ALLOCATED_TO_BRANCH' THEN
        UPDATE intel.m_devices
        SET brdcount = GREATEST(COALESCE(brdcount, 0) - 1, 0),
            ddcount = COALESCE(ddcount, 0) + 1
        WHERE bid = p_bid AND brid = p_brid;

      WHEN 'ALLOCATED_TO_MERCHANT' THEN
        UPDATE intel.m_devices
        SET mdcount = GREATEST(COALESCE(mdcount, 0) - 1, 0),
            ddcount = COALESCE(ddcount, 0) + 1
        WHERE bid = p_bid AND brid = p_brid;

      WHEN 'DEVICE_ONBOARDED' THEN
        UPDATE intel.m_devices
        SET incount = GREATEST(COALESCE(incount, 0) - 1, 0),
            ddcount = COALESCE(ddcount, 0) + 1
        WHERE bid = 0 AND brid = 0;

      ELSE
        RAISE NOTICE 'No action taken for last_action = %', p_last_action;
        RETURN 0;
    END CASE;

    RETURN 1;

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in mc_device_deactivator: %', SQLERRM;
    RETURN 0;
  END;
END;
$$ LANGUAGE plpgsql;
