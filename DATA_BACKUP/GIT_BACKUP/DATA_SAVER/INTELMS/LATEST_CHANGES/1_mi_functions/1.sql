-- ===========================
-- DEVICE CALCULATOR ITERATORS
-- ===========================

CREATE OR REPLACE FUNCTION intel.mi_incount_incrementer(p_input JSON[])
RETURNS TABLE(row_id INT, msg TEXT, status INT) AS $$
DECLARE
  row JSON;
  result INT;
BEGIN
  FOREACH row IN ARRAY p_input LOOP
    result := intel.mc_incount_incrementer();
    RETURN QUERY SELECT (row->>'row_id')::INT, CASE WHEN result = 1 THEN 'incount_incrementer success' ELSE 'incount_incrementer failed' END, result;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mi_incount_decrementer(p_input JSON[])
RETURNS TABLE(row_id INT, msg TEXT, status INT) AS $$
DECLARE
  row JSON;
  result INT;
BEGIN
  FOREACH row IN ARRAY p_input LOOP
    result := intel.mc_incount_decrementer();
    RETURN QUERY SELECT (row->>'row_id')::INT, CASE WHEN result = 1 THEN 'incount_decrementer success' ELSE 'incount_decrementer failed' END, result;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mi_bdcount_incrementer(p_input JSON[])
RETURNS TABLE(row_id INT, msg TEXT, status INT) AS $$
DECLARE
  row JSON;
  bid INT;
  result INT;
BEGIN
  FOREACH row IN ARRAY p_input LOOP
    bid := (row->>'bid')::INT;
    result := intel.mc_bdcount_incrementer(bid);
    RETURN QUERY SELECT (row->>'row_id')::INT, CASE WHEN result = 1 THEN 'bdcount_incrementer success' ELSE 'bdcount_incrementer failed' END, result;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mi_bdcount_decrementer(p_input JSON[])
RETURNS TABLE(row_id INT, msg TEXT, status INT) AS $$
DECLARE
  row JSON;
  bid INT;
  result INT;
BEGIN
  FOREACH row IN ARRAY p_input LOOP
    bid := (row->>'bid')::INT;
    result := intel.mc_bdcount_decrementer(bid);
    RETURN QUERY SELECT (row->>'row_id')::INT, CASE WHEN result = 1 THEN 'bdcount_decrementer success' ELSE 'bdcount_decrementer failed' END, result;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mi_brdcount_incrementer(p_input JSON[])
RETURNS TABLE(row_id INT, msg TEXT, status INT) AS $$
DECLARE
  row JSON;
  bid INT;
  brid INT;
  result INT;
BEGIN
  FOREACH row IN ARRAY p_input LOOP
    bid := (row->>'bid')::INT;
    brid := (row->>'brid')::INT;
    result := intel.mc_brdcount_incrementer(bid, brid);
    RETURN QUERY SELECT (row->>'row_id')::INT, CASE WHEN result = 1 THEN 'brdcount_incrementer success' ELSE 'brdcount_incrementer failed' END, result;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mi_brdcount_decrementer(p_input JSON[])
RETURNS TABLE(row_id INT, msg TEXT, status INT) AS $$
DECLARE
  row JSON;
  bid INT;
  brid INT;
  result INT;
BEGIN
  FOREACH row IN ARRAY p_input LOOP
    bid := (row->>'bid')::INT;
    brid := (row->>'brid')::INT;
    result := intel.mc_brdcount_decrementer(bid, brid);
    RETURN QUERY SELECT (row->>'row_id')::INT, CASE WHEN result = 1 THEN 'brdcount_decrementer success' ELSE 'brdcount_decrementer failed' END, result;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mi_mdcount_incrementer(p_input JSON[])
RETURNS TABLE(row_id INT, msg TEXT, status INT) AS $$
DECLARE
  row JSON;
  bid INT;
  brid INT;
  result INT;
BEGIN
  FOREACH row IN ARRAY p_input LOOP
    bid := (row->>'bid')::INT;
    brid := (row->>'brid')::INT;
    result := intel.mc_mdcount_incrementer(bid, brid);
    RETURN QUERY SELECT (row->>'row_id')::INT, CASE WHEN result = 1 THEN 'mdcount_incrementer success' ELSE 'mdcount_incrementer failed' END, result;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mi_mdcount_decrementer(p_input JSON[])
RETURNS TABLE(row_id INT, msg TEXT, status INT) AS $$
DECLARE
  row JSON;
  bid INT;
  brid INT;
  result INT;
BEGIN
  FOREACH row IN ARRAY p_input LOOP
    bid := (row->>'bid')::INT;
    brid := (row->>'brid')::INT;
    result := intel.mc_mdcount_decrementer(bid, brid);
    RETURN QUERY SELECT (row->>'row_id')::INT, CASE WHEN result = 1 THEN 'mdcount_decrementer success' ELSE 'mdcount_decrementer failed' END, result;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- BANK AND BRANCH CALCULATORS
-- ===========================

CREATE OR REPLACE FUNCTION intel.mi_bank_incrementer(p_input JSON[])
RETURNS TABLE(row_id INT, msg TEXT, status INT) AS $$
DECLARE
  row JSON;
  bid INT;
  result INT;
BEGIN
  FOREACH row IN ARRAY p_input LOOP
    bid := (row->>'bid')::INT;
    result := intel.mc_bank_incrementer(bid);
    RETURN QUERY SELECT (row->>'row_id')::INT, CASE WHEN result = 1 THEN 'bank_incrementer success' ELSE 'bank_incrementer failed' END, result;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mi_branch_incrementer(p_input JSON[])
RETURNS TABLE(row_id INT, msg TEXT, status INT) AS $$
DECLARE
  row JSON;
  bid INT;
  brid INT;
  result INT;
BEGIN
  FOREACH row IN ARRAY p_input LOOP
    bid := (row->>'bid')::INT;
    brid := (row->>'brid')::INT;
    result := intel.mc_branch_incrementer(bid, brid);
    RETURN QUERY SELECT (row->>'row_id')::INT, CASE WHEN result = 1 THEN 'branch_incrementer success' ELSE 'branch_incrementer failed' END, result;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- MERCHANT CALCULATORS
-- ===========================

CREATE OR REPLACE FUNCTION intel.mi_merchant_incrementer(p_input JSON[])
RETURNS TABLE(row_id INT, msg TEXT, status INT) AS $$
DECLARE
  row JSON;
  bid INT;
  brid INT;
  result INT;
BEGIN
  FOREACH row IN ARRAY p_input LOOP
    bid := (row->>'bid')::INT;
    brid := (row->>'brid')::INT;
    result := intel.mc_merchant_incrementer(bid, brid);
    RETURN QUERY SELECT (row->>'row_id')::INT, CASE WHEN result = 1 THEN 'merchant_incrementer success' ELSE 'merchant_incrementer failed' END, result;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mi_merchant_decrementer(p_input JSON[])
RETURNS TABLE(row_id INT, msg TEXT, status INT) AS $$
DECLARE
  row JSON;
  bid INT;
  brid INT;
  result INT;
BEGIN
  FOREACH row IN ARRAY p_input LOOP
    bid := (row->>'bid')::INT;
    brid := (row->>'brid')::INT;
    result := intel.mc_merchant_decrementer(bid, brid);
    RETURN QUERY SELECT (row->>'row_id')::INT, CASE WHEN result = 1 THEN 'merchant_decrementer success' ELSE 'merchant_decrementer failed' END, result;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- DEVICE ISSUES
-- ===========================

CREATE OR REPLACE FUNCTION intel.mi_di_open_incrementer(p_input JSON[])
RETURNS TABLE(row_id INT, msg TEXT, status INT) AS $$
DECLARE
  row JSON;
  bid INT;
  brid INT;
  result INT;
BEGIN
  FOREACH row IN ARRAY p_input LOOP
    bid := (row->>'bid')::INT;
    brid := (row->>'brid')::INT;
    result := intel.mc_di_open_incrementer(bid, brid);
    RETURN QUERY SELECT (row->>'row_id')::INT, CASE WHEN result = 1 THEN 'di_open_incrementer success' ELSE 'di_open_incrementer failed' END, result;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mi_di_open_decrementer(p_input JSON[])
RETURNS TABLE(row_id INT, msg TEXT, status INT) AS $$
DECLARE
  row JSON;
  bid INT;
  brid INT;
  result INT;
BEGIN
  FOREACH row IN ARRAY p_input LOOP
    bid := (row->>'bid')::INT;
    brid := (row->>'brid')::INT;
    result := intel.mc_di_open_decrementer(bid, brid);
    RETURN QUERY SELECT (row->>'row_id')::INT, CASE WHEN result = 1 THEN 'di_open_decrementer success' ELSE 'di_open_decrementer failed' END, result;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mi_di_closed_incrementer(p_input JSON[])
RETURNS TABLE(row_id INT, msg TEXT, status INT) AS $$
DECLARE
  row JSON;
  bid INT;
  brid INT;
  result INT;
BEGIN
  FOREACH row IN ARRAY p_input LOOP
    bid := (row->>'bid')::INT;
    brid := (row->>'brid')::INT;
    result := intel.mc_di_closed_incrementer(bid, brid);
    RETURN QUERY SELECT (row->>'row_id')::INT, CASE WHEN result = 1 THEN 'di_closed_incrementer success' ELSE 'di_closed_incrementer failed' END, result;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- DEVICE REQUESTS
-- ===========================

CREATE OR REPLACE FUNCTION intel.mi_dr_open_incrementer(p_input JSON[])
RETURNS TABLE(row_id INT, msg TEXT, status INT) AS $$
DECLARE
  row JSON;
  bid INT;
  brid INT;
  result INT;
BEGIN
  FOREACH row IN ARRAY p_input LOOP
    bid := (row->>'bid')::INT;
    brid := (row->>'brid')::INT;
    result := intel.mc_dr_open_incrementer(bid, brid);
    RETURN QUERY SELECT (row->>'row_id')::INT, CASE WHEN result = 1 THEN 'dr_open_incrementer success' ELSE 'dr_open_incrementer failed' END, result;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mi_dr_open_decrementer(p_input JSON[])
RETURNS TABLE(row_id INT, msg TEXT, status INT) AS $$
DECLARE
  row JSON;
  bid INT;
  brid INT;
  result INT;
BEGIN
  FOREACH row IN ARRAY p_input LOOP
    bid := (row->>'bid')::INT;
    brid := (row->>'brid')::INT;
    result := intel.mc_dr_open_decrementer(bid, brid);
    RETURN QUERY SELECT (row->>'row_id')::INT, CASE WHEN result = 1 THEN 'dr_open_decrementer success' ELSE 'dr_open_decrementer failed' END, result;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.mi_dr_closed_incrementer(p_input JSON[])
RETURNS TABLE(row_id INT, msg TEXT, status INT) AS $$
DECLARE
  row JSON;
  bid INT;
  brid INT;
  result INT;
BEGIN
  FOREACH row IN ARRAY p_input LOOP
    bid := (row->>'bid')::INT;
    brid := (row->>'brid')::INT;
    result := intel.mc_dr_closed_incrementer(bid, brid);
    RETURN QUERY SELECT (row->>'row_id')::INT, CASE WHEN result = 1 THEN 'dr_closed_incrementer success' ELSE 'dr_closed_incrementer failed' END, result;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
