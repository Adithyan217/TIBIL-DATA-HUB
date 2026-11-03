select * from workflow.wfevtslog
where eid = 3001
order by eid

select * from workflow.wfhlog
-- where eid = 3000
order by eid DESC

select * from workflow.wfalog
where eid = 3002
order by eid


select * from workflow.wfactions
order by aid

select * from workflow.wfhsteps
order by sid

select * from registry.routes

select * from registry.banks order by bid
select * from registry.branches where brid = 69


select * from registry.mf order by mfid
select * from registry.mf_v order by mfid

select * from registry.model order by mdid
select * from registry.model_v order by mdid

select * from registry.firmware order by fid
select * from registry.firmware_v order by fid


select * from registry.devices order by did desc
select * from registry.devices_v order by did DESC

select * from registry.merchants order by mpid
select * from registry.merchants_v order by mpid

select * from registry.sb order by sid desc
select * from registry.sb_v order by sid desc

select * from registry.vpa   order by vid desc
select * from registry.vpa_v  order by vid desc


select * from registry.upermissions where username like 'see%' group by username


select * from registry.routes

SELECT 1 AS results FROM registry.vpa v WHERE v.vpa = 'invalid' AND v.bid = (SELECT bid FROM registry.banks WHERE bname = 'tester_bank'  )AND isd = false AND isa = true

SELECT  el.eid
                 FROM workflow.wfevtslog AS el
                 INNER JOIN workflow.wfalog AS al ON el.eid = al.eid
                 LEFT JOIN workflow.wfactions AS ac ON ac.aid = al.aid
                 WHERE (
                el.eby = '05d69885-9e9d-48e8-8673-3ba4d11fbf20'
                OR ac.vcode = ANY(ARRAY['Device Request', 'Device Issue']))
				order by el.eid
				AND el.eid = 2586




ALTER TABLE registry.devices_v
ADD COLUMN sbe BOOLEAN DEFAULT false;




DROP FUNCTION IF EXISTS registry.add_user_permissions;

CREATE OR REPLACE FUNCTION registry.add_user_permissions(
    p_username TEXT,
    p_banks TEXT[],
    p_branches TEXT[]
)
RETURNS TABLE(username VARCHAR, context registry.ucontexts, context_id INT) AS $$
DECLARE
    bank_name TEXT;
    branch_name TEXT;
    bank_id INT;
    branch_id INT;
BEGIN
    -- Loop through each bank name provided

    FOR i IN 1..COALESCE(array_length(p_banks, 1), 0) 
    LOOP
        SELECT bid INTO bank_id FROM registry.banks WHERE bname = p_banks[i];
		
		IF EXISTS (SELECT 1 FROM registry.upermissions AS u WHERE u.username=p_username AND u.context_id=bank_id AND u.context='BANK') THEN
			CONTINUE;
		ELSE	
			IF bank_id IS NOT NULL THEN
	            RETURN QUERY
	            INSERT INTO registry.upermissions AS u(username, context, context_id)
	            VALUES (p_username, 'BANK', bank_id)
	            RETURNING u.username, u.context, u.context_id;
	        ELSE
	            RAISE NOTICE 'Bank "%" not found.', p_banks[i];
	        END IF;
		END IF;
    END LOOP;

    -- Loop through each branch name provided
		FOR i IN 1..COALESCE(array_length(p_branches, 1), 0) 
	    LOOP
	      SELECT brid INTO branch_id FROM registry.branches WHERE brname = p_branches[i];
		  
		  IF EXISTS (SELECT 1 FROM registry.upermissions AS u WHERE u.username=p_username AND u.context_id=branch_id AND u.context='BRANCH') THEN
				CONTINUE;
		  ELSE	
	        IF branch_id IS NOT NULL THEN
	            RETURN QUERY
	            INSERT INTO registry.upermissions AS u(username, context, context_id)
	            VALUES (p_username, 'BRANCH', branch_id)
	            RETURNING u.username, u.context, u.context_id;
	        ELSE
	            RAISE NOTICE 'Branch "%" not found.', p_branches[i];
	        END IF;
		 END IF;
	    END LOOP;
END;
$$ LANGUAGE plpgsql;


CREATE INDEX IF NOT EXISTS idx_upermissions_username_contex_context_id
ON registry.upermissions(username,context,context_id);


ALTER TABLE registry.upermissions
ADD CONSTRAINT upermissions_unique UNIQUE (username, context, context_id);


select * from registry.upermissions 
select * from workflow.upermissions 
select * from intel.upermissions 

select * from registry.status


INSERT INTO registry.status (context,status,priority)
VALUES 
('device','In Inventory',1),
('device','Enabled',2),
('device','Not Enabled',3),
('device_request','Allocated',1),
('device_request','Dispatched',2),
('device_request','Delivered',3),
('onboard_device','To Inventory',1),
('onboard_device','Allocated to Bank',2),
('onboard_device','Allocated to Branch',3),
('onboard_device','Allocated to Merchant',4),
('device_issues','Resolved',1),
('device_issues','Invalid-Closed',2)
;
select * from registry.orgs

SELECT * FROM registry.add_user_permissions(
 'vinuta.hegde@tibilsolutions.com',
 ARRAY['Jana Bank'],
 ARRAY[]::TEXT[]
);

SELECT * FROM intel.add_user_permissions(
 'vinuta.hegde@tibilsolutions.com',
 ARRAY['Jana Bank'],
 ARRAY[]::TEXT[]
);

SELECT * FROM workflow.add_user_permissions(
 'vinuta.hegde@tibilsolutions.com',
 ARRAY['BANK']::workflow.ucontexts[],
 ARRAY[541]
)



select * from registry.upermissions where username = 'vinuta.hegde@tibilsolutions.com' AND context = 'BRANCH'

--------------------------REGISTRY

DO $$
DECLARE
    branch_names TEXT[];
BEGIN
    SELECT ARRAY(
        SELECT brname FROM registry.branches
    ) INTO branch_names;

    PERFORM registry.add_user_permissions('vinuta.hegde@tibilsolutions.com', ARRAY[]::TEXT[], branch_names);
END;
$$ LANGUAGE plpgsql;

-------------INTEL

DO $$
DECLARE
    branch_names TEXT[];
BEGIN
    SELECT ARRAY(
        SELECT brname FROM registry.branches
    ) INTO branch_names;

    PERFORM intel.add_user_permissions('vinuta.hegde@tibilsolutions.com', ARRAY[]::TEXT[], branch_names);
END;
$$ LANGUAGE plpgsql;


select DISTINCT(dname,imei) from drouter.soundboxes order by dname 
select * from registry.devices order by dname


UPDATE registry.devices
SET sbe = true
WHERE dname IN (
    SELECT dname FROM drouter.soundboxes
);


SELECT * from drouter.soundboxes WHERE dname = '11001100'
dname not in (select dname from registry.devices)

select * from registry.devices where dname = '11001100'
select * from drouter.deactivated_list
SELECT s.dname
FROM drouter.soundboxes s
LEFT JOIN registry.devices d ON s.dname = d.dname
WHERE d.dname IS NULL;

select dname from registry.devices where did in (select did from registry.sb where sbevt = 'ALLOCATED_TO_BRANCH')


select count(*) from registry.sb where sbevt = 'ALLOCATED_TO_BRANCH'
select count(*) from registry.sb where sbevt = 'ALLOCATED_TO_MERCHANT'


select * from registry.merchants where mname = 'MAA MANGALA AUTO PARTS'



select * from registry.sb where did = (select did from registry.devices where dname = '100786')


select * from workflow.wfhlog where eid = 1

DROP FUNCTION validate_strings
CREATE OR REPLACE FUNCTION validate_strings(input_values TEXT[])
RETURNS TEXT[] AS $$
DECLARE
    valid_values TEXT[] := '{}';
    val TEXT;
BEGIN
    FOREACH val IN ARRAY input_values
    LOOP
        -- Replace this with your actual validation logic
        IF exists (select 1 from registry.sb WHERE did = (select did from registry.devices where dname = val) AND sbevt != 'VPA_DEVICE_BIND') THEN  -- example: only strings longer than 3 characters
            valid_values := array_append(valid_values, val);
        END IF;
    END LOOP;
    RETURN valid_values;
END;
$$ LANGUAGE plpgsql;

select * FROM validate_strings(
ARRAY[
  '100557', '100558', '100559', '100562', '100563', '100568', '100572', '100574', '100577', '100578',
  '100583', '100592', '100596', '100601', '100602', '100604', '100611', '100612', '100615', '100616',
  '100624', '100630', '100632', '100648', '100670', '100675', '100677', '100678', '100679', '100681',
  '100683', '100684', '100685', '100686', '100694', '100700', '100712', '100716', '100733', '100754',
  '100758', '100760', '100771', '100773', '100776', '100777', '100778', '100779', '100780', '100790',
  '100797', '100807', '100808', '100809', '100813', '100815', '100819', '100822', '100824', '100826',
  '100827', '100828', '100829', '100833', '100837', '100843', '100845', '100854', '100859', '100863',
  '100865', '100871', '100873', '100875', '100876', '100877', '100878', '100879', '100883', '100884',
  '100885', '100886', '100888', '100892', '100893', '100894', '100895', '100896', '100897', '100901',
  '100902', '100904', '100906', '100907', '100910', '100911', '100914', '100915', '100918', '100924',
  '100925', '100926', '100927', '100930', '100931', '100932', '100933', '100934', '100936', '100937',
  '100939', '100940', '100941', '100942', '100943', '100944', '100945', '100946', '100947', '100948',
  '100949', '100950', '100951', '100952', '100954', '100955', '100956', '100958', '100959', '100960',
  '100962', '100963', '100964', '100967', '100968', '100969', '100970', '100971', '100972', '100973',
  '100974', '100975', '100976', '100977', '100978', '100979', '100980', '100981', '100982', '100983',
  '100984', '100985', '100986', '100989', '100990', '100991', '100992', '100994', '100995', '100996',
  '100997', '100998', '100999', '101000', '101001', '101002', '101003', '101004', '101005', '101007',
  '101008', '101010', '101011', '101012', '101013', '101014', '101015', '101016', '100899', '100900',
  '100901', '100902', '100903', '100904', '100905', '100906', '100907', '100908', '100909', '100910',
  '100911', '100912', '100913', '100914', '100915', '100916', '100917', '100918', '100919', '100920',
  '100921', '100922', '100923', '100924', '100925', '100926', '100927', '100928', '100929', '100930',
  '100931', '100932', '100933', '100934', '100935', '100936', '100937', '100939', '100940', '100941',
  '100942', '100943', '100944', '100945', '100946', '100947', '100948', '100949', '100950', '100951',
  '100952', '100953', '100954', '100955', '100956', '100957', '100958', '100959', '100960', '100962',
  '100963', '100964', '100965', '100966', '100967', '100968', '100969', '100970', '100971', '100972',
  '100973', '100974', '100975', '100976', '100977', '100978', '100979', '100980', '100981', '100982',
  '100983', '100984', '100985', '100986', '100987', '100988', '100989', '100990', '100991', '100992',
  '100993', '100994', '100995', '100996', '100997', '100998', '100999', '101000', '101001', '101002',
  '101003', '101004', '101005', '101006', '101007', '101008', '101009', '101010', '101011', '101012',
  '101013', '101014', '101015', '101016'
]

)

select * from registry.merchants WHERE brid = 69
461 462 818 819
select * from registry.sb where brid = 69

select count(*) from registry.sb where sbevt = 'DEVICE_ONBOARDED'

select * from registry.sb where did IN (select did from registry.devices where dname IN ('100903','100988','100786','100869'))

select * from registry.devices where dname IN ('100903','100988','100786','100869')

DELETE FROM registry.sb
WHERE did IN (
    SELECT did
    FROM registry.devices
    WHERE dname IN ('100903', '100988', '100786', '100869')
);

DELETE FROM registry.sb_v
WHERE did IN (
    SELECT did
    FROM registry.devices
    WHERE dname IN ('100903', '100988', '100786', '100869')
);

DELETE FROM registry.devices
WHERE dname IN ('100903', '100988', '100786', '100869');

DELETE FROM registry.devices_v
WHERE dname IN ('100903', '100988', '100786', '100869');

select dname from registry.devices

DELETE FROM registry.vpa where did IN (select did from registry.devices where dname IN ('100903','100988','100786','100869'))

DELETE FROM registry.vpa_v where vid in (select vid from registry.vpa where did IN (select did from registry.devices where dname IN ('100903','100988','100786','100869')))



CREATE OR REPLACE FUNCTION registry.vpa_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO registry.vpa_v (vid, vpa, vevt, eid, eat, eby, isd,isa,did, op)
    VALUES (NEW.vid, NEW.vpa, NEW.vevt, NEW.eid, NEW.eat, NEW.eby, NEW.isd,NEW.isa,NEW.did, 'CREATED');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.isd = true AND OLD.isd = false THEN
      INSERT INTO registry.vpa_v (vid, vpa, vevt, eid, eat, eby, isd,isa,did, op)
      VALUES (NEW.vid, NEW.vpa, NEW.vevt, NEW.eid, NEW.eat, NEW.eby, NEW.isd,NEW.isa,NEW.did, 'DELETED');
    ELSE
      INSERT INTO registry.vpa_v (vid, vpa, vevt, eid, eat, eby, isd,isa,did, op)
      VALUES (NEW.vid, NEW.vpa, NEW.vevt, NEW.eid, NEW.eat, NEW.eby, NEW.isd,NEW.isa,NEW.did, 'UPDATED');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;



select * from drouter.deactivated_list




select * from drouter.soundboxes\
\

select * from registry.mf_v order by pid

select f.fid, f.fname, fv.eat FROM registry.firmware as f JOIN registry.firmware_v as fv ON fv.fid = f.fid WHERE f.isd = FALSE AND f.mfid =(SELECT mf.mfid FROM registry.mf WHERE mfname=  'mf_1') 






