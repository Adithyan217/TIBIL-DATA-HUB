BEGIN;

SELECT plan(2);

SELECT * INTO TEMP tmp_batch_result
FROM registry.bank_iterator(
    rowid := ARRAY[101, 102],
    bank_id := ARRAY[]::INT[], -- Both inserts
    bank_names := ARRAY['Batch Test Bank 11', 'Batch Test Bank 12'],
    bank_addrs := ARRAY['Addr 1', 'Addr 2'],
    binfo_list := ARRAY['{}'::jsonb, '{}'::jsonb],
    event_bys := ARRAY['user1', 'user2'],
    eids := ARRAY[6001, 6002]
);

SELECT is(
    (SELECT count(*)::INT FROM tmp_batch_result),
    2,
    'Iterator should process 2 rows'
);

SELECT is(
    (SELECT bool_and(status = 1) FROM tmp_batch_result),
    true,
    'All iterator operations should return status 1 (success)'
);

SELECT * FROM finish();

ROLLBACK;



