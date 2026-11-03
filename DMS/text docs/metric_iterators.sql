
-------------------------------------------SB OPERATION METRIC ITTERATOR---------------------------------------


---ALLOCATE TO BANK

CREATE OR REPLACE FUNCTION intel.mi_allocate_to_bank(data JSON[])
RETURNS TABLE (row_id INT, msg TEXT, status INT)
LANGUAGE plpgsql AS $$
DECLARE
    item     JSON;
    row_val  INT;
    bid_val  INT;
    result_1 INT;
    result_2 INT;
BEGIN
    FOREACH item IN ARRAY data LOOP
        row_val := (item->>'row_id')::INT;
        bid_val := (item->>'bid')::INT;

        result_1 := intel.mc_incount_decrementer();
        result_2 := intel.mc_bdcount_incrementer(bid_val);

        IF result_1 = 1 AND result_2 = 1 THEN
            RETURN QUERY SELECT row_val, 'metric success', 1;
        ELSE
            RETURN QUERY SELECT row_val, 'metric failed', 0;
        END IF;
    END LOOP;
END;
$$;



---ALLOCATE TO BRANCH

CREATE OR REPLACE FUNCTION intel.mi_allocate_to_branch(data JSON[])
RETURNS TABLE (row_id INT, msg TEXT, status INT)
LANGUAGE plpgsql AS $$
DECLARE
    item     JSON;
    row_val  INT;
    bid_val  INT;
    brid_val INT;
    result_1 INT;
    result_2 INT;
BEGIN
    FOREACH item IN ARRAY data LOOP
        row_val  := (item->>'row_id')::INT;
        bid_val  := (item->>'bid')::INT;
        brid_val := (item->>'brid')::INT;

        result_1 := intel.mc_bdcount_decrementer(bid_val);

        result_2 := intel.mc_brdcount_incrementer(bid_val, brid_val);

        IF result_1 = 1 AND result_2 = 1 THEN
            RETURN QUERY SELECT row_val, 'metric success', 1;
        ELSE
            RETURN QUERY SELECT row_val, 'metric failed', 0;
        END IF;
    END LOOP;
END;
$$;


-- ALLOCATE TO MERCHANT

CREATE OR REPLACE FUNCTION intel.mi_allocate_to_merchant(data JSON[])
RETURNS TABLE (row_id INT, msg TEXT, status INT)
LANGUAGE plpgsql AS $$
DECLARE
    item     JSON;
    row_val  INT;
    bid_val  INT;
    brid_val INT;
    result   INT;
BEGIN
    FOREACH item IN ARRAY data LOOP
        row_val  := (item->>'row_id')::INT;
        bid_val  := (item->>'bid')::INT;
        brid_val := (item->>'brid')::INT;

        -- Only increment merchant count
        result := intel.mc_mdcount_incrementer(bid_val, brid_val);

        IF result = 1 THEN
            RETURN QUERY SELECT row_val, 'metric success', 1;
        ELSE
            RETURN QUERY SELECT row_val, 'metric failed', 0;
        END IF;
    END LOOP;
END;
$$;


-------------------------------------------DEVICE METRIC ITTERATOR---------------------------------------


----COMMON ITTERATOR------------
CREATE OR REPLACE FUNCTION intel.mi_onboard_device(data JSON[])
RETURNS TABLE (row_id INT, msg TEXT, status INT)
LANGUAGE plpgsql
AS $$
DECLARE
    item       JSON;
    bid_val    INT;
    brid_val   INT;
    row_val    INT;
    steps_arr  TEXT[];
    last_step  TEXT;
BEGIN
    FOREACH item IN ARRAY data LOOP
        row_val   := (item->>'row_id')::INT;
        bid_val   := (item->>'bid')::INT;
        brid_val  := (item->>'brid')::INT;
        steps_arr := ARRAY(SELECT jsonb_array_elements_text(item->'steps')::TEXT);
        last_step := steps_arr[array_length(steps_arr, 1)];

        BEGIN
            IF last_step = 'ONBOARD_DEVICE' THEN
                PERFORM intel.mc_incount_incrementer(bid_val, brid_val);

            ELSIF last_step = 'ALLOCATE_TO_BANK' THEN
                PERFORM intel.mc_incount_decrementer(bid_val, brid_val);
                PERFORM intel.mc_bdcount_incrementer(bid_val, brid_val);

            ELSIF last_step = 'ALLOCATE_TO_BRANCH' THEN
                PERFORM intel.mc_bdcount_decrementer(bid_val, brid_val);
                PERFORM intel.mc_brdcount_incrementer(bid_val, brid_val);

            ELSIF last_step = 'ALLOCATE_TO_MERCHANT' THEN
                PERFORM intel.mc_mdcount_incrementer(bid_val, brid_val);

            ELSE
                RETURN QUERY SELECT row_val, 'invalid step', 0;
                CONTINUE;
            END IF;

            RETURN QUERY SELECT row_val, 'metric success', 1;

        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error processing row_id %: %', row_val, SQLERRM;
            RETURN QUERY SELECT row_val, 'metric failed', 0;
        END;
    END LOOP;
END;
$$;


-- SEPEREATE
--IN INVENTORY
CREATE OR REPLACE FUNCTION intel.mi_onboard_device_toinventory(data JSON[])
RETURNS TABLE (row_id INT, msg TEXT, status INT)
LANGUAGE plpgsql AS $$
DECLARE
    item JSON;
    row_val INT;
    result INT;
BEGIN
    FOREACH item IN ARRAY data LOOP
        row_val := (item->>'row_id')::INT;

        result := intel.mc_incount_incrementer();

        IF result = 1 THEN
            RETURN QUERY SELECT row_val, 'metric success', 1;
        ELSE
            RETURN QUERY SELECT row_val, 'metric failed', 0;
        END IF;
    END LOOP;
END;
$$;

-- TO BANK

CREATE OR REPLACE FUNCTION intel.mi_onboard_device_tobank(data JSON[])
RETURNS TABLE (row_id INT, msg TEXT, status INT)
LANGUAGE plpgsql AS $$
DECLARE
    item JSON;
    row_val INT;
    bid_val INT;
    result INT;
BEGIN
    FOREACH item IN ARRAY data LOOP
        row_val := (item->>'row_id')::INT;
        bid_val := (item->>'bid')::INT;

        result := intel.mc_bdcount_incrementer(bid_val);  -- brid defaults to 0

        IF result = 1 THEN
            RETURN QUERY SELECT row_val, 'metric success', 1;
        ELSE
            RETURN QUERY SELECT row_val, 'metric failed', 0;
        END IF;
    END LOOP;
END;
$$;


-- TO BRANCH

CREATE OR REPLACE FUNCTION intel.mi_onboard_device_tobranch(data JSON[])
RETURNS TABLE (row_id INT, msg TEXT, status INT)
LANGUAGE plpgsql AS $$
DECLARE
    item JSON;
    row_val INT;
    bid_val INT;
    brid_val INT;
    result INT;
BEGIN
    FOREACH item IN ARRAY data LOOP
        row_val := (item->>'row_id')::INT;
        bid_val := (item->>'bid')::INT;
        brid_val := (item->>'brid')::INT;

        result := intel.mc_brdcount_incrementer(bid_val, brid_val);

        IF result = 1 THEN
            RETURN QUERY SELECT row_val, 'metric success', 1;
        ELSE
            RETURN QUERY SELECT row_val, 'metric failed', 0;
        END IF;
    END LOOP;
END;
$$;

-- TO MERCHANT

CREATE OR REPLACE FUNCTION intel.mi_onboard_device_tomerchant(data JSON[])
RETURNS TABLE (row_id INT, msg TEXT, status INT)
LANGUAGE plpgsql AS $$
DECLARE
    item JSON;
    row_val INT;
    bid_val INT;
    brid_val INT;
    r1 INT;
    r2 INT;
BEGIN
    FOREACH item IN ARRAY data LOOP
        row_val := (item->>'row_id')::INT;
        bid_val := (item->>'bid')::INT;
        brid_val := (item->>'brid')::INT;

        r1 := intel.mc_brdcount_incrementer(bid_val, brid_val);
        r2 := intel.mc_mdcount_incrementer(bid_val, brid_val);

        IF r1 = 1 AND r2 = 1 THEN
            RETURN QUERY SELECT row_val, 'metric success', 1;
        ELSE
            RETURN QUERY SELECT row_val, 'metric failed', 0;
        END IF;
    END LOOP;
END;
$$;

-------------------------------------------BRANCH METRIC ITTERATOR---------------------------------------

CREATE OR REPLACE FUNCTION intel.mi_onboard_branch(data JSON[])
RETURNS TABLE (row_id INT, msg TEXT, status INT)
LANGUAGE plpgsql
AS $$
DECLARE
    item     JSON;
    bid_val  INT;
    brid_val INT;
    row_val  INT;
    result   INT;
BEGIN
    FOREACH item IN ARRAY data LOOP
        row_val  := (item->>'row_id')::INT;
        bid_val  := (item->>'bid')::INT;
        brid_val := (item->>'brid')::INT;

        result := intel.mc_branch_incrementer(bid_val, brid_val);

        IF result = 1 THEN
            RETURN QUERY SELECT row_val, 'metric success', 1;
        ELSE
            RETURN QUERY SELECT row_val, 'metric failed', 0;
        END IF;
    END LOOP;
END;
$$;

-------------------------------------------MERCHANT METRIC ITTERATOR---------------------------------------

CREATE OR REPLACE FUNCTION intel.mi_onboard_merchant(data JSON[])
RETURNS TABLE (row_id INT, msg TEXT, status INT)
LANGUAGE plpgsql
AS $$
DECLARE
    item     JSON;
    bid_val  INT;
    brid_val INT;
    row_val  INT;
    result   INT;
BEGIN
    FOREACH item IN ARRAY data LOOP
        row_val  := (item->>'row_id')::INT;
        bid_val  := (item->>'bid')::INT;
        brid_val := (item->>'brid')::INT;

        result := intel.mc_merchant_incrementer(bid_val, brid_val);

        IF result = 1 THEN
            RETURN QUERY SELECT row_val, 'metric success', 1;
        ELSE
            RETURN QUERY SELECT row_val, 'metric failed', 0;
        END IF;
    END LOOP;
END;
$$;

-------------------------------------------DEVICE ISSUE METRIC ITTERATOR---------------------------------------

-----DEVICE ISSUE OPEN
CREATE OR REPLACE FUNCTION intel.mi_device_issue_open(data JSON[])
RETURNS TABLE (row_id INT, msg TEXT, status INT)
LANGUAGE plpgsql
AS $$
DECLARE
    item     JSON;
    bid_val  INT;
    brid_val INT;
    row_val  INT;
    result   INT;
BEGIN
    FOREACH item IN ARRAY data LOOP
        row_val  := (item->>'row_id')::INT;
        bid_val  := (item->>'bid')::INT;
        brid_val := (item->>'brid')::INT;

        result := intel.mc_di_open_incrementer(bid_val, brid_val);

        IF result = 1 THEN
            RETURN QUERY SELECT row_val, 'metric success', 1;
        ELSE
            RETURN QUERY SELECT row_val, 'metric failed', 0;
        END IF;
    END LOOP;
END;
$$;

----DEVICE ISSUE CLOSED
CREATE OR REPLACE FUNCTION intel.mi_device_issue_closed(data JSON[])
RETURNS TABLE (row_id INT, msg TEXT, status INT)
LANGUAGE plpgsql
AS $$
DECLARE
    item       JSON;
    bid_val    INT;
    brid_val   INT;
    row_val    INT;
    open_res   INT;
    close_res  INT;
BEGIN
    FOREACH item IN ARRAY data LOOP
        row_val  := (item->>'row_id')::INT;
        bid_val  := (item->>'bid')::INT;
        brid_val := (item->>'brid')::INT;

        open_res  := intel.mc_di_open_decrementer(bid_val, brid_val);
        close_res := intel.mc_di_closed_incrementer(bid_val, brid_val);

        IF open_res = 1 AND close_res = 1 THEN
            RETURN QUERY SELECT row_val, 'metric success', 1;
        ELSE
            RETURN QUERY SELECT row_val, 'metric failed', 0;
        END IF;
    END LOOP;
END;
$$;


-------------------------------------------DEVICE REQUESTS METRIC ITTERATOR---------------------------------------

---DEVICE REQUEST OPEN

CREATE OR REPLACE FUNCTION intel.mi_device_request_open(data JSON[])
RETURNS TABLE (row_id INT, msg TEXT, status INT)
LANGUAGE plpgsql
AS $$
DECLARE
    item     JSON;
    bid_val  INT;
    brid_val INT;
    row_val  INT;
    result   INT;
BEGIN
    FOREACH item IN ARRAY data LOOP
        row_val  := (item->>'row_id')::INT;
        bid_val  := (item->>'bid')::INT;
        brid_val := (item->>'brid')::INT;

        result := intel.mc_dr_open_incrementer(bid_val, brid_val);

        IF result = 1 THEN
            RETURN QUERY SELECT row_val, 'metric success', 1;
        ELSE
            RETURN QUERY SELECT row_val, 'metric failed', 0;
        END IF;
    END LOOP;
END;
$$;


---DEVICE REQUEST CLOSED

CREATE OR REPLACE FUNCTION intel.mi_device_request_closed(data JSON[])
RETURNS TABLE (row_id INT, msg TEXT, status INT)
LANGUAGE plpgsql
AS $$
DECLARE
    item       JSON;
    bid_val    INT;
    brid_val   INT;
    row_val    INT;
    open_res   INT;
    close_res  INT;
BEGIN
    FOREACH item IN ARRAY data LOOP
        row_val  := (item->>'row_id')::INT;
        bid_val  := (item->>'bid')::INT;
        brid_val := (item->>'brid')::INT;

        open_res  := intel.mc_dr_open_decrementer(bid_val, brid_val);
        close_res := intel.mc_dr_closed_incrementer(bid_val, brid_val);

        IF open_res = 1 AND close_res = 1 THEN
            RETURN QUERY SELECT row_val, 'metric success', 1;
        ELSE
            RETURN QUERY SELECT row_val, 'metric failed', 0;
        END IF;
    END LOOP;
END;
$$;
