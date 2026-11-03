BEGIN;

SELECT plan(7);

-- Setup shared valid data
INSERT INTO registry.mf (mfname, isd, mfevt, eid, eby)
VALUES ('Valid_MF', 'false', 'MF_ONBOARDED', 1, 'admin');

INSERT INTO registry.firmware (eid, frevt, eby, fname, mfid)
VALUES (101, 'FIRMWARE_ONBOARDED', 'admin', 'Valid_FW', (SELECT mfid FROM registry.mf WHERE mfname = 'Valid_MF'));

INSERT INTO registry.model (eid, mdevt, eby, mdname, mfid, fid)
VALUES (201, 'MODEL_ONBOARDED', 'admin', 'Valid_MD', 
    (SELECT mfid FROM registry.mf WHERE mfname = 'Valid_MF'),
    (SELECT fid FROM registry.firmware WHERE fname = 'Valid_FW'));

-- Valid inserts
SELECT * INTO TEMP temp_1
FROM registry.device_iterator(
    rowid := ARRAY[1,2],
    d_id := ARRAY[NULL, NULL],
    mf_name := ARRAY['Valid_MF', 'Valid_MF'],
    d_names := ARRAY['Device_1', 'Device_2'],
    md_name := ARRAY['Valid_MD', 'Valid_MD'],
    f_name := ARRAY['Valid_FW', 'Valid_FW'],
    imei := ARRAY['IMEI12345', 'IMEI12346'],
    event_bys := ARRAY['admin', 'admin'],
    eids := ARRAY[501, 502]
);

SELECT is(
    (SELECT count(*) FROM temp_1),
    2,
    '2 valid inserts processed'
);

SELECT is(
    (SELECT count(*) FROM temp_1 WHERE msg::TEXT[] = ARRAY['SUCCESS_INSERT']),
    2,
    'Both valid rows inserted successfully'
);

SELECT is(
    (SELECT bool_and(status = 1) FROM temp_1),
    true,
    'Both valid rows have status = 1'
);

-- Invalids + 1 valid
SELECT * INTO TEMP temp_2
FROM registry.device_iterator(
    rowid := ARRAY[1,2,3],
    d_id := ARRAY[NULL, NULL, NULL],
    mf_name := ARRAY[
        'Valid_MF',     -- Will trigger DEVICE_REPEATED, IMEI_REPEATED
        'Invalid_MF',   -- INVALID_MF, INVALID_MODEL
        'Valid_MF'      -- Valid row
    ],
    d_names := ARRAY[
        'Device_1',     -- Already inserted
        'New_Device',
        'Device_3'
    ],
    md_name := ARRAY[
        'Valid_MD',     -- Exists
        'Invalid_MD',
        'Valid_MD'
    ],
    f_name := ARRAY[
        'Valid_FW',
        'Valid_FW',
        'Valid_FW'
    ],
    imei := ARRAY[
        'IMEI12345',
        'IMEI99999',
        'IMEI12347'
    ],
    event_bys := ARRAY['u1', 'u2', 'u3'],
    eids := ARRAY[601, 602, 603]
);

SELECT is(
    (SELECT msg FROM temp_2 LIMIT 1)::TEXT[],
    ARRAY['DEVICE_REPEATED','IMEI_REPEATED'],
    'Among 3 #1 fails with DEVICE_REPEATED, IMEI_REPEATED'
);

SELECT is(
    (SELECT msg FROM temp_2 OFFSET 1 LIMIT 1)::TEXT[],
    ARRAY['INVALID_MF','INVALID_MODEL'],
    'Among 3 #2 fails with INVALID_MF, INVALID_MODEL'
);

SELECT is(
    (SELECT msg FROM temp_2 OFFSET 2 LIMIT 1)::TEXT[],
    ARRAY['SUCCESS_INSERT'],
    'Among 3 #3 succeeded with SUCCESS_INSERT'
);

SELECT * FROM finish();

ROLLBACK;
