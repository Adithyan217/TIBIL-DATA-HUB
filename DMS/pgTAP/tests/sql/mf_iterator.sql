BEGIN;

SELECT plan(7);

-- Insert 2 new valid MFs
SELECT * INTO TEMP temp_mf_1
FROM registry.mf_iterator(
    rowid := ARRAY[1, 2],
    mf_ids := ARRAY[]::INT[],
    mf_names := ARRAY['Batch MF 1', 'Batch MF 2'],
    mf_addrs := ARRAY['Addr 1', 'Addr 2'],
    mfinfo_list := ARRAY['{}'::jsonb, '{}'::jsonb],
    event_bys := ARRAY['user1', 'user2'],
    eids := ARRAY[6001, 6002]
);

SELECT is(
    (SELECT count(*)::INT FROM temp_mf_1),
    2,
    'Passed two rows processed two rows'
);

SELECT is(
    (SELECT count(*)::INT FROM temp_mf_1 WHERE msg::TEXT[] = ARRAY['SUCCESS_INSERT']),
    2,
    'Both inserts returned SUCCESS_INSERT'
);

SELECT is(
    (SELECT bool_and(status = 1)::INT FROM temp_mf_1),
    1,
    'All inserts returned success status'
);

SELECT is (
	(SELECT count(*)::INT FROM registry.mf WHERE mfname in ('Batch MF 1', 'Batch MF 2')),
	2,
	'Checking both the mfs are inserted to table'
);

-- Insert with one duplicate MF name
SELECT * INTO TEMP temp_mf_2
FROM registry.mf_iterator(
    rowid := ARRAY[1, 2],
    mf_ids := ARRAY[]::INT[],
    mf_names := ARRAY['Batch MF 1', 'Batch MF 3'],  -- Batch MF 1 already exists
    mf_addrs := ARRAY['Addr 1', 'Addr 3'],
    mfinfo_list := ARRAY['{}'::jsonb, '{}'::jsonb],
    event_bys := ARRAY['user1', 'user3'],
    eids := ARRAY[6001, 6003]
);

SELECT is(
    (SELECT count(*)::INT FROM temp_mf_2 WHERE msg::TEXT[] = ARRAY['MF_REPEATED']),
    1,
    'Among two rows one row detected MF_REPEATED'
);

SELECT is(
    (SELECT count(*)::INT FROM temp_mf_2 WHERE status = 0),
    1,
    'Among two rows one rows status code is 0 due to duplication'
);

SELECT is(
    (SELECT count(*)::INT FROM temp_mf_2 WHERE status = 1),
    1,
    'Among two rows one row succeeded (new MF)'
);

SELECT * FROM finish();

ROLLBACK;
