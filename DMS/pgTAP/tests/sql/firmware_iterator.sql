BEGIN;

SELECT plan(7);

INSERT INTO registry.mf (mfname, isd,mfevt,eid,eby)
VALUES ('Valid_MF', 'false','MF_ONBOARDED',1,'test');

INSERT INTO registry.firmware (eid, frevt, eby, fname, mfid)
VALUES (1000, 'FIRMWARE_ONBOARDED', 'admin', 'firmware_repeated', 1);

SELECT * INTO TEMP temp_1
FROM registry.firmware_iterator(
    rowid := ARRAY[1,2],
    mf_name := ARRAY['Valid_MF', 'Valid_MF'],
    f_names := ARRAY['firmware_valid_1', 'firmware_valid_2'],
    event_bys := ARRAY['user1', 'user2'],
    eids := ARRAY[8001, 8002]
);

SELECT is(
    (SELECT count(*)::INT FROM temp_1),
    2,
    'Processed 2 valid firmware rows'
);

SELECT is(
    (SELECT count(*)::INT FROM temp_1 WHERE msg::TEXT[] = ARRAY['SUCCESS_INSERT']),
    2,
    'Both valid firmwares inserted successfully'
);

SELECT is(
    (SELECT bool_and(status = 1) FROM temp_1),
    true,
    'Valid firmwares have status = 1'
);

SELECT is(
    (SELECT count(*)::INT FROM registry.firmware WHERE fname IN ('firmware_valid_1', 'firmware_valid_2')),
    2,
    'Valid firmwares exist in registry.firmware'
);


SELECT * INTO TEMP temp_2
FROM registry.firmware_iterator(
    rowid := ARRAY[1,2,3],
    mf_name := ARRAY['invalid_manufacturer', 'Valid_MF', 'Valid_MF'],
    f_names := ARRAY['firmware_valid_3', 'firmware_repeated', 'firmware_valid_3'],
    event_bys := ARRAY['user3', 'user4', 'user5'],
    eids := ARRAY[8003, 8004, 8005]
);

SELECT is(
    (SELECT msg FROM temp_2 LIMIT 1)::TEXT[],
    ARRAY['INVALID_MF'],
    'Among three one firmware fails with INVALID_MF'
);

SELECT is(
    (SELECT msg FROM temp_2 OFFSET 1 LIMIT 1)::TEXT[],
    ARRAY['FIRMWARE_REPEATED'],
    'Among three one firmware fails with FIRMWARE_REPEATED'
);

SELECT is (
	(SELECT msg FROM temp_2 OFFSET 2 LIMIT 1)::TEXT[],
    ARRAY['SUCCESS_INSERT'],
    'Among three one with SUCCESS_INSERT'
);

SELECT * FROM finish();

ROLLBACK;
