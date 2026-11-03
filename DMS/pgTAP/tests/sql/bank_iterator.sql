BEGIN;

SELECT plan(11);

SELECT * INTO TEMP temp_1
FROM registry.bank_iterator(
    rowid := ARRAY[1, 2],
    bank_id := ARRAY[]::INT[], 
    bank_names := ARRAY['Batch Test Bank 11', 'Batch Test Bank 12'],
    bank_addrs := ARRAY['Addr 1', 'Addr 2'],
    binfo_list := ARRAY['{}'::jsonb, '{}'::jsonb],
    event_bys := ARRAY['user1', 'user2'],
    eids := ARRAY[6001, 6002]
);



SELECT is(
    (SELECT count(*)::INT FROM temp_1),
    2,
    'Passed two rows processed two rows'
);

SELECT is( 
	(SELECT count(*)::INT FROM temp_1 WHERE msg::TEXT[] = ARRAY['SUCCESS_INSERT']),
	2,
	'Passed two valid rows, response with two success message'
);			

SELECT is(
    (SELECT bool_and(status = 1) FROM temp_1),
    true,
    'Passed two valid rows, response with two success status code'
);

SELECT is(
	(SELECT count(*)::INT FROM registry.banks WHERE bname IN ('Batch Test Bank 11', 'Batch Test Bank 12')),
	2,
	'Checking whether both banks have been inserted to the table'
);

SELECT * INTO TEMP temp_2
FROM registry.bank_iterator(
    rowid := ARRAY[1, 2],
    bank_id := ARRAY[]::INT[],
    bank_names := ARRAY['Batch Test Bank 11', 'Batch Test Bank 123'],
    bank_addrs := ARRAY['Addr 1', 'Addr 2'],
    binfo_list := ARRAY['{}'::jsonb, '{}'::jsonb],
    event_bys := ARRAY['user1', 'user2'],
    eids := ARRAY[6001, 6002]
);

SELECT is( 
	(SELECT count(*)::INT FROM temp_2 WHERE msg::TEXT[] = ARRAY['BANK_REPEATED']),
	1,
	'Passed 1 rows with repeated bank name, response with BANK_REPEATED message'
);			

SELECT is(
    (SELECT count(*)::INT FROM temp_2 where status = 0),
    1,
    'Passed one invalid and one valid row, response with one failure status code'
);

SELECT is(
    (SELECT count(*)::INT FROM temp_2 where status = 1),
    1,
    'Passed one invalid and one valid row, response with one success status code'
);


SELECT * INTO TEMP temp_3
FROM registry.bank_iterator(
    rowid := ARRAY[1,2,3],
    bank_id := ARRAY[0,(SELECT bid FROM registry.banks where bname = 'Batch Test Bank 11'),(SELECT bid FROM registry.banks where bname = 'Batch Test Bank 11')]::INT[],
    bank_names := ARRAY[]::VARCHAR[],
    bank_addrs := ARRAY['Addr 1',NULL,'updated'],
    binfo_list := ARRAY['{}'::jsonb,NULL,'{"updated":1}'::jsonb],
    event_bys := ARRAY['user1', 'user2', 'user3'],
    eids := ARRAY[6001, 6002,6002]
);


SELECT is(
    (SELECT msg FROM temp_3 LIMIT 1)::TEXT[],
    ARRAY['INVALID_BANK'],
    'updating with invalid bank name , Response with INVALID_BANK msg'
);

SELECT is(
    (SELECT msg FROM temp_3 OFFSET 1 LIMIT 1)::TEXT[],
    ARRAY['EMPTY_UPDATE'],
    'updating with empty data , Response with EMPTY_UPDATE msg'
);

SELECT is(
    (SELECT msg FROM temp_3 OFFSET 2 LIMIT 1)::TEXT[],
    ARRAY['SUCCESS_UPDATE'],
    'updating with valid data , Response with SUCCESS_UPDATE msg'
);

SELECT is(
    (SELECT count(*)::INT 
     FROM registry.banks 
     WHERE baddr = 'updated' 
       AND binfo::jsonb = '{"updated":1}'::jsonb),
    1,
    'Checking updating with valid data results in table'
);

SELECT * FROM finish();

ROLLBACK;