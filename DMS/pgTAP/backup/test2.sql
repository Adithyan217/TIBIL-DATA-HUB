BEGIN;

SELECT plan(2);

SELECT * INTO TEMP tmp_result
FROM registry.bank_validator_writer(
    rowid := 100,
    b_id := NULL,
    b_name := 'Test Bank Insert',
    b_addr := 'Test Address',
    b_info := '{"test_key": "test_value"}'::jsonb,
    e_by := 'tester_insert',
    e_id := 5001
);

SELECT is(
    (SELECT status FROM tmp_result),
    1,
    'Insert new bank should return status 1'
);

SELECT is(
    (SELECT msg[1] FROM tmp_result),
    'SUCCESS_INSERT',
    'Insert new bank should return SUCCESS_INSERT message'
);

SELECT * FROM finish();

ROLLBACK;


-- BEGIN;

-- SELECT plan(1);

-- SELECT is(
--   (SELECT ROW(status, msg[1]::TEXT) 
--    FROM registry.bank_validator_writer(
--      rowid := 100,
--      b_id := NULL,
--      b_name := 'Test Bank Insert',
--      b_addr := 'Test Address',
--      b_info := '{"test_key": "test_value"}'::jsonb,
--      e_by := 'tester_insert',
--      e_id := 5001
--    )
--   ),
--   ROW(1, 'SUCCESS_INSERT'::TEXT),
--   'Status and message should match'
-- );

-- SELECT * FROM finish();

-- ROLLBACK;