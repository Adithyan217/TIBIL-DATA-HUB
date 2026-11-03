BEGIN;

SELECT plan(8);

INSERT INTO registry.mf (mfname, isd, mfevt, eid, eby)
VALUES ('Valid_MF', 'false', 'MF_ONBOARDED', 1, 'user_mf');

INSERT INTO registry.firmware (eid, frevt, eby, fname, mfid)
VALUES (100, 'FIRMWARE_ONBOARDED', 'user_fw', 'Valid_FW', (SELECT mfid FROM registry.mf WHERE mfname = 'Valid_MF'));

-- Pre-insert one model for repeat test
INSERT INTO registry.model (eid, mdevt, eby, mdname, mfid, fid)
VALUES (200, 'MODEL_ONBOARDED', 'admin', 'model_repeated', (SELECT mfid FROM registry.mf WHERE mfname = 'Valid_MF'), (SELECT fid FROM registry.firmware WHERE fname = 'Valid_FW'));

--  VALID models
SELECT * INTO TEMP temp_1
FROM registry.model_iterator(
    rowid := ARRAY[1,2],
    mf_names := ARRAY['Valid_MF', 'Valid_MF'],
    md_names := ARRAY['model_valid_1', 'model_valid_2'],
    f_names := ARRAY['Valid_FW', 'Valid_FW'],
    event_bys := ARRAY['user1', 'user2'],
    eids := ARRAY[9001, 9002]
);

SELECT is(
    (SELECT count(*)::INT FROM temp_1),
    2,
    'Processed 2 valid model rows'
);

SELECT is(
    (SELECT count(*)::INT FROM temp_1 WHERE msg::TEXT[] = ARRAY['SUCCESS_INSERT']),
    2,
    'Both valid models inserted successfully'
);

SELECT is(
    (SELECT bool_and(status = 1) FROM temp_1),
    true,
    'Valid models have status = 1'
);

SELECT is(
    (SELECT count(*)::INT FROM registry.model WHERE mdname IN ('model_valid_1', 'model_valid_2')),
    2,
    'Valid models exist in registry.model'
);

--  INVALID models
SELECT * INTO TEMP temp_2
FROM registry.model_iterator(
    rowid := ARRAY[1,2,3,4],
    mf_names := ARRAY['invalid_manufacturer', 'Valid_MF', 'Valid_MF', 'Valid_MF'],
    md_names := ARRAY['model_valid_3', 'model_repeated', 'model_valid_3', 'model_valid_3'],
    f_names := ARRAY['Valid_FW', 'Valid_FW', 'invalid_firmware', 'Valid_FW'],
    event_bys := ARRAY['user3', 'user4', 'user5', 'user5'],
    eids := ARRAY[9003, 9004, 9005, 9005]
);

SELECT is(
    (SELECT msg FROM temp_2 LIMIT 1)::TEXT[],
    ARRAY['INVALID_MF'],
    'Among 4 model #1 fails with INVALID_MF'
);

SELECT is(
    (SELECT msg FROM temp_2 OFFSET 1 LIMIT 1)::TEXT[],
    ARRAY['MODEL_REPEATED'],
    'Among 4 model #2 fails with MODEL_REPEATED'
);

SELECT is(
    (SELECT msg FROM temp_2 OFFSET 2 LIMIT 1)::TEXT[],
    ARRAY['INVALID_FIRMWARE'],
    'Among 4 model #3 fails with INVALID_FIRMWARE'
);

SELECT is(
    (SELECT msg FROM temp_2 OFFSET 3 LIMIT 1)::TEXT[],
    ARRAY['SUCCESS_INSERT'],
    'Among 4 model #4 passes with SUCCESS_INSERT'
);

SELECT * FROM finish();

ROLLBACK;
