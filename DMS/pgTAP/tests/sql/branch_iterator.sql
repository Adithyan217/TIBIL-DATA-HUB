BEGIN;

SELECT plan(11);

INSERT INTO registry.banks(
	 baddr, bname, binfo, bevt, eid, eby)
	VALUES ( 'Valid Bank', 'Valid Bank', '{"valid":"bank"}'::jsonb, 'BANK_ONBOARDED', 1, '1');
	
-- Insert VALID branches
SELECT * INTO TEMP temp_1
FROM registry.branch_iterator(
    rowid := ARRAY[1,2],
    br_id := ARRAY[]::INT[],
    bank_names := ARRAY['Valid Bank', 'Valid Bank'],
    br_names := ARRAY['Valid Branch 1', 'Valid Branch 2'],
    br_addrs := ARRAY['Addr 1', 'Addr 2'],
    brinfo_list := ARRAY['{}'::jsonb, '{}'::jsonb],
    event_bys := ARRAY['user1', 'user2'],
    eids := ARRAY[7001, 7002]
);

-- Validate valid inserts
SELECT is(
    (SELECT count(*)::INT FROM temp_1),
    2,
    'Passed two rows processed for valid branches'
);

SELECT is(
    (SELECT count(*)::INT FROM temp_1 WHERE msg::TEXT[] = ARRAY['SUCCESS_INSERT']),
    2,
    'Both valid branches inserted successfully'
);

SELECT is(
    (SELECT bool_and(status = 1) FROM temp_1),
    true,
    'Both valid branches have status 1'
);

SELECT is(
    (SELECT count(*)::INT 
     FROM registry.branches 
     WHERE brname IN ('Valid Branch 1', 'Valid Branch 2')),
    2,
    'Both valid branches present in table'
);

-- Insert INVALID branches
SELECT * INTO TEMP temp_2
FROM registry.branch_iterator(
    rowid := ARRAY[1,2,3],
    br_id := ARRAY[NULL,NULL,NULL]::INT[],
    bank_names := ARRAY['invalid_bank', 'Valid Bank', 'Valid Bank'],
    br_names := ARRAY['Valid Branch 11', 'Valid Branch 1', 'Valid Branch 11'],
    br_addrs := ARRAY['address', 'address', 'address'],
    brinfo_list := ARRAY['{}'::jsonb, '{}'::jsonb, '{}'::jsonb],
    event_bys := ARRAY['user3', 'user4', 'user5'],
    eids := ARRAY[7003, 7004, 7005]
);



SELECT is(
    (SELECT msg FROM temp_2 LIMIT 1)::TEXT[],
    ARRAY['INVALID_BANK'],
    'Among 3 branches one fails with INVALID_BANK'
);

SELECT is(
    (SELECT msg FROM temp_2 OFFSET 1 LIMIT 1)::TEXT[],
    ARRAY['BRANCH_REPEATED'],
    'Among 3 branches one fails with BRANCH_REPEATED'
);

SELECT is(
    (SELECT msg FROM temp_2 OFFSET 2 LIMIT 1)::TEXT[],
    ARRAY['SUCCESS_INSERT'],
    'Among 3 branches one is sccessfull '
);

SELECT * INTO TEMP temp_3
FROM registry.branch_iterator(
    rowid := ARRAY[1,2,3],
    br_id := ARRAY[0, (SELECT brid FROM registry.branches WHERE brname ='Valid Branch 1'),(SELECT brid FROM registry.branches WHERE brname ='Valid Branch 1')],
    bank_names := ARRAY[NULL,NULL,NULL],
    br_names := ARRAY[NULL,NULL,NULL],
    br_addrs := ARRAY['address', NULL, 'updated'],
    brinfo_list := ARRAY['{}'::jsonb, NULL, '{"ipdated":1}'::jsonb],
    event_bys := ARRAY['user3', 'user4', 'user5'],
    eids := ARRAY[7003, 7004, 7005]
);

SELECT is(
    (SELECT msg FROM temp_3 LIMIT 1)::TEXT[],
    ARRAY['INVALID_BRANCH'],
    'Updating branch fails with INVALID_BRANCH'
);

SELECT is(
    (SELECT msg FROM temp_3 OFFSET 1 LIMIT 1)::TEXT[],
    ARRAY['EMPTY_UPDATE'],
    'Updating branch fails with EMPTY_UPDATE'
);

SELECT is(
    (SELECT msg FROM temp_3 OFFSET 2 LIMIT 1)::TEXT[],
    ARRAY['SUCCESS_UPDATE'],
    'Succesfull update'
);

SELECT is(
	(SELECT count(*)::INT FROM registry.branches WHERE brname = 'Valid Branch 1' AND braddr = 'updated'),
	1,
	'Checking whether the updation reflects in table'
);

SELECT * FROM finish();

ROLLBACK;



