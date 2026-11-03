DELETE FROM registry.sb_v WHERE did in (SELECT did FROM registry.devices WHERE dname LIKE 'tester%');
DELETE FROM registry.sb WHERE did in (SELECT did FROM registry.devices WHERE dname LIKE 'tester%');

DELETE FROM registry.vpa_v WHERE vpa LIKE 'tester%';
DELETE FROM registry.vpa WHERE vpa LIKE 'tester%';

DELETE FROM registry.devices_v WHERE dname LIKE 'tester%';
DELETE FROM registry.devices WHERE dname LIKE 'tester%';

DELETE FROM registry.merchants_v WHERE mname LIKE 'tester%';
DELETE FROM registry.merchants WHERE mname LIKE 'tester%';

DELETE FROM registry.branches_v WHERE brname LIKE 'tester%';
DELETE FROM registry.branches WHERE brname LIKE 'tester%';

DELETE FROM registry.banks_v WHERE bname LIKE 'tester%';
DELETE FROM registry.banks WHERE bname LIKE 'tester%';





DO $$ 
DECLARE 
    v_mfid INT;
    v_fid INT;
	v_mdid INT;
BEGIN
    INSERT INTO registry.mf (mfname, mfaddr, mfinfo, mfevt, eid, eby)
    VALUES ('tester_mf', 'testarea', '{"name":"tester"}', 'MF_ONBOARDED', 123, '05d69885-9e9d-48e8-8673-3ba4d11fbf20')
    ON CONFLICT (mfname) DO UPDATE SET eat = CURRENT_TIMESTAMP  
    RETURNING mfid INTO v_mfid;

    INSERT INTO registry.firmware (mfid, fname, frevt, eid, eby)
    VALUES (v_mfid, 'tester_firmware', 'FIRMWARE_ONBOARDED', 123, '05d69885-9e9d-48e8-8673-3ba4d11fbf20')
    ON CONFLICT (fname) DO UPDATE SET eat = CURRENT_TIMESTAMP
    RETURNING fid INTO v_fid;  --fname unique
	
    INSERT INTO registry.model (mfid, fid, eid, mdname, mdevt, eby)
    VALUES (v_mfid, v_fid, 123, 'tester_model', 'MODEL_ONBOARDED', '05d69885-9e9d-48e8-8673-3ba4d11fbf20')
    ON CONFLICT (mdname) DO UPDATE SET eat = CURRENT_TIMESTAMP
	RETURNING mdid INTO v_mdid;    --mdname unique

	INSERT INTO registry.banks(
	bid, baddr, bname, binfo, bevt, eid, eby)
	VALUES (99999, 'tester_area', 'tester_bank', '{"binfo":"info"}', 'BANK_ONBOARDED', 123, '05d69885-9e9d-48e8-8673-3ba4d11fbf20')
	ON CONFLICT (bname) DO UPDATE SET eat = CURRENT_TIMESTAMP
	;    --bname unique

	INSERT INTO registry.branches(
	brid,bid, braddr, brname, brinfo, brevt, eid, eby)
	VALUES (99999,99999, 'tester_area', 'tester_branch', '{"binfo":"info"}', 'BRANCH_ONBOARDED', 123, '05d69885-9e9d-48e8-8673-3ba4d11fbf20')
	ON CONFLICT (brname) DO UPDATE SET eat = CURRENT_TIMESTAMP
	;    --bname unique

	INSERT INTO registry.merchants(
	mpid, msid, mname, minfo, bid, mevt, eid, brid,eby, maddr)
	VALUES (99999, 1, 'tester_merchant', '{"testdata":"test"}', 99999, 'MERCHANT_ONBOARDED',1, 99999, '05d69885-9e9d-48e8-8673-3ba4d11fbf20', 'test_area')
	ON CONFLICT (mname) DO UPDATE SET eat = CURRENT_TIMESTAMP ;
	
	INSERT INTO registry.devices (did, dname, imei, mfid, fid, mdid, devt, eid, eby)
	VALUES (99999, 'tester_device', 'tester_imei', v_mfid, v_fid, v_mdid, 'DEVICE_ONBOARDED', 1, '05d69885-9e9d-48e8-8673-3ba4d11fbf20')
	ON CONFLICT (dname) DO UPDATE SET eat = CURRENT_TIMESTAMP
	;

-----registry test only
	INSERT INTO registry.vpa(
	vid, vpa, bid, vevt, eid, eby, did)
	VALUES (99999, 'tester_vpa@vpa', 99999, 'VPA_ONBOARDED', 123, '05d69885-9e9d-48e8-8673-3ba4d11fbf20', 99999)
	ON CONFLICT (vpa) DO UPDATE SET eat = CURRENT_TIMESTAMP;

END $$;




