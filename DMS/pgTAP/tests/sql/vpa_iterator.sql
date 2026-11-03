BEGIN;

SELECT plan(7);

INSERT INTO registry.banks (bname, isd, bevt, eid, eby)
VALUES ('Valid_Bank', 'false', 'BANK_ONBOARDED', 1, 'admin');

INSERT INTO registry.mf (mfname, isd, mfevt, eid, eby)
VALUES ('Valid_MF', 'false', 'MF_ONBOARDED', 1, 'user_mf');

INSERT INTO registry.firmware (eid, frevt, eby, fname, mfid)
VALUES (100, 'FIRMWARE_ONBOARDED', 'user_fw', 'Valid_FW', (SELECT mfid FROM registry.mf WHERE mfname = 'Valid_MF'));

INSERT INTO registry.model (eid, mdevt, eby, mdname, mfid, fid)
VALUES (200, 'MODEL_ONBOARDED', 'admin', 'Valid_MD', (SELECT mfid FROM registry.mf WHERE mfname = 'Valid_MF'), (SELECT fid FROM registry.firmware WHERE fname = 'Valid_FW'));

INSERT INTO registry.devices (dname, isd, devt, eid, eby, mfid, fid,mdid)
VALUES ('Valid_Device_1', 'false', 'DEVICE_ONBOARDED', 1, 'admin',(SELECT mfid FROM registry.mf WHERE mfname = 'Valid_MF'), (SELECT fid FROM registry.firmware WHERE fname = 'Valid_FW'),(SELECT mdid FROM registry.model WHERE mdname = 'Valid_MD')),
       ('Valid_Device_2', 'false', 'DEVICE_ONBOARDED', 1, 'admin',(SELECT mfid FROM registry.mf WHERE mfname = 'Valid_MF'), (SELECT fid FROM registry.firmware WHERE fname = 'Valid_FW'),(SELECT mdid FROM registry.model WHERE mdname = 'Valid_MD')),
       ('Valid_Device_3', 'false', 'DEVICE_ONBOARDED', 1, 'admin',(SELECT mfid FROM registry.mf WHERE mfname = 'Valid_MF'), (SELECT fid FROM registry.firmware WHERE fname = 'Valid_FW'),(SELECT mdid FROM registry.model WHERE mdname = 'Valid_MD'));



SELECT * INTO TEMP temp_1
FROM registry.vpa_iterator(
    rowid := ARRAY[1,2],
    vpa_name := ARRAY['vpa_valid@upi1','vpa_valid@upi2'],
    d_name := ARRAY['Valid_Device_1','Valid_Device_2'],
    b_name := ARRAY['Valid_Bank','Valid_Bank'],
    event_bys := ARRAY['user1','user1'],
    eids := ARRAY[1001,1001]
);

SELECT is(
    (SELECT count(*)::INT FROM temp_1),
    2,
    '2 rows passed ,Processed 2 rows'
);

SELECT is(
    (SELECT count(*)::INT FROM temp_1 WHERE msg::TEXT[] = ARRAY['SUCCESS_INSERT']),
    2,
    'Both rows inserted successfullyvwith msg SUCCESS_INSERT'
);

SELECT is(
    (SELECT bool_and(status = 1) FROM temp_1),
    true,
    'Both rows have status = 1'
);

SELECT is(
    (SELECT count(*)::INT FROM registry.vpa WHERE vpa IN ('vpa_valid@upi1','vpa_valid@upi2')),
    2,
    'Both rows inserted exist in table'
);



SELECT * INTO TEMP temp_2
FROM registry.vpa_iterator(
    rowid := ARRAY[1,2,3],
    vpa_name := ARRAY[
        'vpa_valid@upi1',     -- VPA_REPEATED-- DEVICE_REPEATED
               
        'vpa_new@upi',     -- INVALID_BANK -- INVALID_DEVICE
            
        'vpa_last@upi'       
    ],
    d_name := ARRAY[
        'Valid_Device_1',     
        
        'Invalid_Device',
        
        'Valid_Device_3'
    ],
    b_name := ARRAY[
        'Valid_Bank',
		
        'Invalid_Bank',
        
        'Valid_Bank'
    ],
    event_bys := ARRAY['u1', 'u2', 'u3'],
    eids := ARRAY[2001, 2002, 2003]
);

SELECT is(
    (SELECT msg FROM temp_2 LIMIT 1)::TEXT[],
    ARRAY['VPA_REPEATED','DEVICE_REPEATED'],
    'Among 3 #1 Fails with VPA_REPEATED,DEVICE_REPEATED'
);

SELECT is(
    (SELECT msg FROM temp_2 OFFSET 1 LIMIT 1)::TEXT[],
    ARRAY['INVALID_BANK','INVALID_DEVICE'],
    'Among 3 #2 Fails with INVALID_BANK,INVALID_DEVICE'
);

SELECT is(
    (SELECT msg FROM temp_2 OFFSET 2 LIMIT 1)::TEXT[],
    ARRAY['SUCCESS_INSERT'],
    'Among 3 #3 succeeded with SUCCESS_INSERT'
);




SELECT * FROM finish();

ROLLBACK;
