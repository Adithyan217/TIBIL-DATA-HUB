CREATE TABLE IF NOT EXISTS intel.m_banks (
  pid SERIAL PRIMARY KEY,
  bid INT UNIQUE NOT NULL,
  eat TIMESTAMP DEFAULT NOW(),
  isd BOOLEAN DEFAULT FALSE
);


CREATE OR REPLACE FUNCTION intel.mc_bank_incrementer(p_bid INT)
RETURNS INT AS $$
BEGIN
 BEGIN
  INSERT INTO intel.m_banks (bid)
  VALUES (p_bid);
    RETURN 1;  -- Success

  EXCEPTION WHEN OTHERS THEN
    -- Log the error message to server log
    RAISE NOTICE 'Error in execution: %', SQLERRM;
    RETURN 0;  -- Failure
  END;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION intel.mi_onboard_bank(data JSON[])
RETURNS TABLE (row_id INT, msg TEXT, status INT)
LANGUAGE plpgsql
AS $$
DECLARE
    item     JSON;
    bid_val  INT;
    row_val  INT;
    result   INT;
BEGIN
    FOREACH item IN ARRAY data LOOP
        row_val := (item->>'row_id')::INT;
        bid_val := (item->>'bid')::INT;

        result := intel.mc_bank_incrementer(bid_val);

        IF result = 1 THEN
            RETURN QUERY SELECT row_val, 'metric success', 1;
        ELSE
            RETURN QUERY SELECT row_val, 'metric failed', 0;
        END IF;
    END LOOP;
END;
$$;

select * from intel.m_banks
truncate table intel.m_banks
select * from intel.metric_flow