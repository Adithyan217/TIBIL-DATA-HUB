BEGIN;

SELECT plan(12);

INSERT INTO registry.banks (bname, isd, bevt, eid, eby)
VALUES ('Valid_Bank', 'false', 'BANK_ONBOARDED', 1, 'admin');

INSERT INTO registry.branches (brname, isd, brevt, eid, eby)
VALUES ('Valid_Branch', 'false', 'BRANCH_ONBOARDED', 1, 'admin');

SELECT * INTO TEMP temp_1
FROM registry.merchant_iterator(
    rowid := ARRAY[1, 2],
    mp_id := ARRAY[NULL, NULL]::INTEGER[],
    m_name := ARRAY['merchant_valid_1', 'merchant_valid_2'],
    m_addr := ARRAY['123 Main St', '456 Second St'],
    b_name := ARRAY['Valid_Bank', 'Valid_Bank'],
    br_name := ARRAY['Valid_Branch', 'Valid_Branch'],
    minfo := ARRAY['{"type":"retail"}'::jsonb, '{"type":"wholesale"}'::jsonb],
    msid := ARRAY[101, 102],
    event_bys := ARRAY['user1', 'user2'],
    eids := ARRAY[1001, 1002]
);

SELECT is(
    (SELECT count(*)::INT FROM temp_1),
    2,
    'Processed 2 valid merchant rows'
);

SELECT is(
    (SELECT count(*)::INT FROM temp_1 WHERE msg::TEXT[] = ARRAY['SUCCESS_INSERT']),
    2,
    'Both merchants inserted successfully'
);

SELECT is(
    (SELECT bool_and(status = 1) FROM temp_1),
    true,
    'Valid merchants have status = 1'
);

SELECT is(
    (SELECT count(*)::INT FROM registry.merchants WHERE mname IN ('merchant_valid_1', 'merchant_valid_2')),
    2,
    'Valid merchants exist in registry.merchants'
);

SELECT * INTO TEMP temp_2
FROM registry.merchant_iterator(
    rowid := ARRAY[1,2,3,4],
    mp_id := ARRAY[NULL, NULL, NULL, NULL]::INTEGER[],
    m_name := ARRAY['merchant_valid_1', 'merchant_valid_3', 'merchant_valid_4', 'merchant_valid_5'],
    m_addr := ARRAY['Any', 'Any', 'Any', 'Any'],
    b_name := ARRAY['Valid_Bank', 'Valid_Bank', 'invalid_bank', 'Valid_Bank'],
    br_name := ARRAY['Valid_Branch', 'invalid_branch', 'Valid_Branch', 'Valid_Branch'],
    minfo := ARRAY['{"type":"retail"}'::jsonb, '{"type":"retail"}'::jsonb, '{"type":"retail"}'::jsonb, '{"type":"retail"}'::jsonb],
    msid := ARRAY[111,112,113,114],
    event_bys := ARRAY['user3','user4','user5','user6'],
    eids := ARRAY[2001,2002,2003,2004]
);

SELECT is(
    (SELECT msg FROM temp_2 LIMIT 1)::TEXT[],
    ARRAY['MERCHANT_REPEATED'],
    'Among 4 merchant #1 fails with MERCHANT_REPEATED'
);

SELECT is(
    (SELECT msg FROM temp_2 OFFSET 1 LIMIT 1)::TEXT[],
    ARRAY['INVALID_BRANCH'],
    'Among 4 merchant #2 fails with INVALID_BRANCH'
);

SELECT is(
    (SELECT msg FROM temp_2 OFFSET 2 LIMIT 1)::TEXT[],
    ARRAY['INVALID_BANK'],
    'Among 4 merchant #3 fails with INVALID_BANK'
);

SELECT is(
    (SELECT msg FROM temp_2 OFFSET 3 LIMIT 1)::TEXT[],
    ARRAY['SUCCESS_INSERT'],
    'Among 4 merchant #4 inserted successfully'
);

SELECT * INTO TEMP temp_3
FROM registry.merchant_iterator(
    rowid := ARRAY[1, 2, 3],
    mp_id := ARRAY[
        0,
        (SELECT mpid FROM registry.merchants WHERE mname = 'merchant_valid_1'),
        (SELECT mpid FROM registry.merchants WHERE mname = 'merchant_valid_1')
    ],
    m_name := ARRAY[]::TEXT[],
    m_addr := ARRAY['Invalid Addr', NULL, 'Updated Addr'],
    b_name := ARRAY[]::TEXT[], -- not needed
    br_name := ARRAY[]::TEXT[], -- not needed
    minfo := ARRAY['{}'::jsonb, NULL, '{"updated": 1}'::jsonb],
    msid := ARRAY[211, 212, 213],
    event_bys := ARRAY['upd1', 'upd2', 'upd3'],
    eids := ARRAY[3001, 3002, 3003]
);

SELECT is(
    (SELECT msg FROM temp_3 LIMIT 1)::TEXT[],
    ARRAY['INVALID_MERCHANT'],
    'Update row failed with  INVALID_MERCHANT'
);

SELECT is(
    (SELECT msg FROM temp_3 OFFSET 1 LIMIT 1)::TEXT[],
    ARRAY['EMPTY_UPDATE'],
    'Update row failed with EMPTY_UPDATE'
);

SELECT is(
    (SELECT msg FROM temp_3 OFFSET 2 LIMIT 1)::TEXT[],
    ARRAY['SUCCESS_UPDATE'],
    'Update row succeeded with SUCCESS_UPDATE'
);

SELECT is(
    (SELECT count(*)::INT FROM registry.merchants 
     WHERE mname = 'merchant_valid_1' 
       AND maddr = 'Updated Addr' 
       AND minfo::jsonb = '{"updated": 1}'::jsonb),
    1,
    'Valid update reflects in table'
);


SELECT * FROM finish();

ROLLBACK;
