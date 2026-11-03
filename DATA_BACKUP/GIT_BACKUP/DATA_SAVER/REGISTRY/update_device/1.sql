-- ALTER TABLE registry.devices ADD COLUMN sbe BOOLEAN DEFAULT false


-- DROP FUNCTION IF EXISTS 
--     registry.device_validator,
--     registry.device_validator_writer,
--     registry.device_iterator;


-- CREATE OR REPLACE FUNCTION registry.device_validator(d_id INTEGER,d_name VARCHAR,mf_id INTEGER,md_id INTEGER,f_id INTEGER,imei_ VARCHAR,sb_e BOOLEAN) 
-- RETURNS registry.devices_msgs[] AS $$
-- DECLARE
-- messages registry.devices_msgs[];
-- BEGIN
-- 	CASE
-- 		WHEN d_id IS NULL THEN
--    			IF EXISTS (SELECT 1 FROM registry.devices WHERE dname = d_name ) THEN
--        		 messages := array_append(messages, 'DEVICE_REPEATED'::registry.devices_msgs);
--     		END IF;
	
-- 			IF NOT EXISTS (SELECT 1 FROM registry.mf WHERE mfid = mf_id AND isd = 'false') THEN
--    			 	messages := array_append(messages, 'INVALID_MF'::registry.devices_msgs);
-- 			END IF;

-- 			IF NOT EXISTS (SELECT 1 FROM registry.model WHERE mdid = md_id AND isd = 'false') THEN
--     			messages := array_append(messages, 'INVALID_MODEL'::registry.devices_msgs);
-- 			END IF;

-- 			IF EXISTS (SELECT 1 FROM registry.devices WHERE imei = imei_ AND isd = 'false') THEN
--     			messages := array_append(messages, 'IMEI_REPEATED'::registry.devices_msgs);
-- 			END IF;

-- 			IF NOT EXISTS (SELECT 1 FROM registry.firmware WHERE fid = f_id AND isd = 'false') THEN
--     			messages := array_append(messages, 'INVALID_FIRMWARE'::registry.devices_msgs);
-- 			END IF;
				

-- 		WHEN d_id IS NOT NULL THEN
--    			IF NOT EXISTS (SELECT 1 FROM registry.devices WHERE did = d_id ) THEN
--        		 messages := array_append(messages, 'INVALID_DEVICE'::registry.devices_msgs);
--     		END IF;
			
-- 			IF f_id IS NULL AND sb_e IS NULL THEN
--        		 messages := array_append(messages, 'EMPTY_UPDATE'::registry.devices_msgs);
--     		END IF;				
			
-- 	END CASE;
--     RETURN messages;
-- END;
-- $$ LANGUAGE plpgsql;



-- CREATE OR REPLACE FUNCTION registry.device_validator_writer(
--     rowid INTEGER,
-- 	d_id INTEGER,
-- 	mf_name VARCHAR,
--     d_name VARCHAR,
--     md_name VARCHAR ,
--     f_name VARCHAR,
-- 	imei_ VARCHAR,
-- 	sb_e BOOLEAN,
--     e_by VARCHAR,
--     e_id INTEGER
-- )
-- RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.devices_msgs[],d_names VARCHAR) AS $$
-- DECLARE
--     devt registry.devts := 'DEVICE_ONBOARDED';
-- 	device_name VARCHAR := null;
-- 	validator_result registry.devices_msgs[];
-- 	mf_id INTEGER := null;
--     md_id INTEGER := null;
--     f_id INTEGER := null;
-- BEGIN

--     SELECT mfid INTO mf_id FROM registry.mf WHERE mfname = mf_name;
--     SELECT mdid INTO md_id FROM registry.model WHERE mdname = md_name;
--     SELECT fid INTO f_id FROM registry.firmware WHERE fname = f_name;

-- 	validator_result := registry.device_validator(d_id,d_name,mf_id,md_id,f_id,imei_,sb_e);
	
-- 	IF array_length(validator_result, 1) > 0 THEN
-- 		RETURN QUERY SELECT rowid,0,validator_result,device_name;
-- 		RETURN;
-- 	END IF;
	
-- 	CASE
-- 		WHEN d_id IS NULL THEN
--     		INSERT INTO registry.devices (eid, devt, eby, dname, mfid, mdid, fid,imei)
--     		VALUES (e_id, devt, e_by, d_name, mf_id, md_id, f_id,imei_)
-- 			RETURNING dname INTO device_name;
--         	RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_INSERT']::registry.devices_msgs[],device_name;
-- 		WHEN d_id IS NOT NULL THEN
--     		UPDATE registry.devices
--        		SET 
-- 			    fid = COALESCE(f_id,fid),
-- 				sbe = COALESCE(sb_e,sbe),
-- 				eby = e_by,
-- 				eid = e_id,
-- 				eat = CURRENT_TIMESTAMP
--        		WHERE did = d_id
--             RETURNING dname INTO device_name;
--        		RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_UPDATE']::registry.devices_msgs[], device_name;
-- 	END CASE;		
-- END;
-- $$ LANGUAGE plpgsql;


-- CREATE OR REPLACE FUNCTION registry.device_iterator(
-- 	rowid INT[],
-- 	d_id INT[],
-- 	mf_name TEXT[],
--     d_names TEXT[],
-- 	md_name TEXT[] ,
--     f_name TEXT[],
-- 	imei TEXT[],
-- 	sbe BOOLEAN[],
--     event_bys TEXT[],
--     eids INT[]
-- ) 
-- RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.devices_msgs[], did VARCHAR) AS
-- $$
-- DECLARE
--     i INT;
-- BEGIN
--     FOR i IN 1..array_length(rowid, 1) LOOP
  
--         RETURN QUERY SELECT * FROM registry.device_validator_writer(
-- 			rowid[i],
-- 			d_id[i],
-- 			mf_name[i],
--     		d_names[i],
-- 			md_name[i] ,
--    			f_name[i],
-- 			imei[i],
-- 			sbe[i],
--     		event_bys[i],   
--             eids[i]
--         ); 
--     END LOOP; 
-- END;
-- $$ LANGUAGE plpgsql;


-- SELECT * FROM registry.device_iterator(
-- 	ARRAY[1],
-- 	ARRAY[1]::integer[],
-- 	ARRAY[]::TEXT[],
--     ARRAY[]::TEXT[], 
--     ARRAY[]::TEXT[], 
--     ARRAY[]::TEXT[],
-- 	ARRAY[]::TEXT[],
-- 	ARRAY[true]::BOOLEAN[],
--     ARRAY['2qw', '2qa'], 
--     ARRAY[28, 28]
-- );





-------------DEVICE AGGREGATOR FUNCTION-------------------

DROP FUNCTION IF EXISTS registry.onboard_device;


CREATE OR REPLACE FUNCTION registry.onboard_device(
    rowid INT[],
    onboard_status VARCHAR,
	event VARCHAR,
	d_id INT[],
	d_names TEXT[],
    mf_name TEXT[],
    md_name TEXT[],
    f_name TEXT[],
    imei TEXT[],
    vpa TEXT[],      -- Bind device
    b_name TEXT[],   -- Allocate to bank
    br_name TEXT[],  -- Allocate to branch
    m_name TEXT[],   -- Allocate to merchant
    event_bys TEXT[],
    eids INT[],
	sbe BOOLEAN[]
) 
RETURNS TABLE (
    a_row_id INTEGER, 
    final_status INTEGER, 
    event_response VARCHAR,
    steps TEXT[],
    step_status INTEGER[],
	update_device_response registry.devices_msgs[],
    onboard_device_response registry.devices_msgs[],
    onboard_vpa_response registry.vpa_msgs[],
    bind_device_response registry.sb_msgs[],
    allocate_to_bank_response registry.sb_msgs[],
    allocate_to_branch_response registry.sb_msgs[],
    allocate_to_merchant_response registry.sb_msgs[]
) AS
$$
DECLARE
    final_status INTEGER;
	action_steps TEXT[];
BEGIN
 IF event = 'UPDATE_DEVICE' AND event = 'ENABLE_SOUNDBOX' THEN
 		RETURN QUERY 
        SELECT row_id, status, did,ARRAY['UPDATE_DEVICE']::TEXT[],ARRAY[status]::INTEGER[], msg,ARRAY[]::registry.devices_msgs[],ARRAY[]::registry.vpa_msgs[], ARRAY[]::registry.sb_msgs[],ARRAY[]::registry.sb_msgs[], ARRAY[]::registry.sb_msgs[], ARRAY[]::registry.sb_msgs[] 
        FROM registry.device_iterator(
            rowid,
            d_id, 
            ARRAY[]::TEXT[],
            ARRAY[]::TEXT[],
            ARRAY[]::TEXT[],
            f_name,
            ARRAY[]::TEXT[],
			sbe,
            event_bys,   
            eids
        );
 ELSE 
  IF onboard_status = 'To Inventory' THEN
        RETURN QUERY 
        SELECT row_id, status, did,ARRAY['ONBOARD_DEVICE']::TEXT[],ARRAY[status]::INTEGER[],ARRAY[]::registry.devices_msgs[], msg,ARRAY[]::registry.vpa_msgs[], ARRAY[]::registry.sb_msgs[],ARRAY[]::registry.sb_msgs[], ARRAY[]::registry.sb_msgs[], ARRAY[]::registry.sb_msgs[] 
        FROM registry.device_iterator(
            rowid,
            ARRAY[]::INT[], 
            mf_name,
            d_names,
            md_name,
            f_name,
            imei,
            event_bys,   
            eids
        );
  ELSIF onboard_status = 'Allocated to Bank' OR onboard_status = 'Allocated to Branch' OR onboard_status = 'Allocated to Merchant' THEN
   BEGIN
    CREATE TEMP TABLE temp_onboard_result (
        row_id INTEGER PRIMARY KEY,
        onb_status INTEGER DEFAULT NULL,
        onboard_device_response registry.devices_msgs[],
        onboard_vpa_status INTEGER DEFAULT NULL,
        onboard_vpa_response registry.vpa_msgs[],
        bind_device_status INTEGER DEFAULT NULL,
        bind_device_response registry.sb_msgs[],
        allocate_bank_status INTEGER DEFAULT NULL,
        allocate_bank_response registry.sb_msgs[],
        allocate_branch_status INTEGER DEFAULT NULL,
        allocate_branch_response registry.sb_msgs[],
        allocate_merchant_status INTEGER DEFAULT NULL,
        allocate_merchant_response registry.sb_msgs[],
        device_id VARCHAR DEFAULT NULL
    ) ON COMMIT DROP;

    
    -- Insert initial device onboarding results
    INSERT INTO temp_onboard_result (row_id, onb_status, onboard_device_response, device_id)
    SELECT row_id, status, msg, did FROM registry.device_iterator(
        rowid,
        ARRAY[]::INT[], 
        mf_name,
        d_names,
        md_name,
        f_name,
        imei,
        event_bys,   
        eids
    );
    
    -- Update with VPA onboarding results
    UPDATE temp_onboard_result tor
    SET onboard_vpa_status = vpa_result.status,
        onboard_vpa_response = vpa_result.msg
    FROM (
        SELECT row_id, status, msg FROM registry.vpa_iterator(
            rowid,
            vpa,
            d_names,
            b_name,
            event_bys,
            eids
        )
    ) AS vpa_result
    WHERE tor.row_id = vpa_result.row_id;

    -- Update with Bind Device results
    UPDATE temp_onboard_result tor
    SET bind_device_status = bind_result.status,
        bind_device_response = bind_result.msgs
    FROM (
        SELECT row_id, status, msgs FROM registry.sb_iterator(
            rowid,
            'BIND_DEVICE',
            vpa,    
            d_names,
            ARRAY[]::TEXT[],
            ARRAY[]::TEXT[],
            ARRAY[]::TEXT[],
            event_bys,
            eids
        )
    ) AS bind_result
    WHERE tor.row_id = bind_result.row_id;
    
     

            -- Update with Allocate to Bank results
            UPDATE temp_onboard_result tor
            SET allocate_bank_status = bank_result.status,
                allocate_bank_response = bank_result.msgs
            FROM (
                SELECT row_id, status, msgs FROM registry.sb_iterator(
                    rowid,
                    'ALLOCATE_TO_BANK',
                    ARRAY[]::TEXT[],    
                    d_names,
                    b_name,
                    ARRAY[]::TEXT[],
                    ARRAY[]::TEXT[],
                    event_bys,
                    eids
                )
            ) AS bank_result
            WHERE tor.row_id = bank_result.row_id;
			action_steps := ARRAY['ONBOARD_DEVICES','ONBOARD_VPA','BIND_DEVICE','ALLOCATE_TO_BANK']::TEXT[];

        IF onboard_status = 'Allocated to Branch' OR onboard_status = 'Allocated to Merchant' THEN
            -- Update with Allocate to Branch results
            UPDATE temp_onboard_result tor
            SET allocate_branch_status = branch_result.status,
                allocate_branch_response = branch_result.msgs
            FROM (
                SELECT row_id, status, msgs FROM registry.sb_iterator(
                    rowid,
                    'ALLOCATE_TO_BRANCH',
                    ARRAY[]::TEXT[],    
                    d_names,
                    ARRAY[]::TEXT[],
                    br_name,
                    ARRAY[]::TEXT[],
                    event_bys,
                    eids
                )
            ) AS branch_result
            WHERE tor.row_id = branch_result.row_id;
			action_steps := ARRAY['ONBOARD_DEVICES','ONBOARD_VPA','BIND_DEVICE','ALLOCATE_TO_BANK','ALLOCATE_TO_BRANCH']::TEXT[];

    	END IF;
		
        IF onboard_status = 'Allocated to Merchant' THEN
            -- Update with Allocate to Merchant results
            UPDATE temp_onboard_result tor
            SET allocate_merchant_status = merchant_result.status,
                allocate_merchant_response = merchant_result.msgs
            FROM (
                SELECT row_id, status, msgs FROM registry.sb_iterator(
                    rowid,
                    'ALLOCATE_TO_MERCHANT',
                    ARRAY[]::TEXT[],    
                    d_names,
                    ARRAY[]::TEXT[],
                    ARRAY[]::TEXT[],
                    m_name,
                    event_bys,
                    eids
                )
            ) AS merchant_result
            WHERE tor.row_id = merchant_result.row_id;
			action_steps := ARRAY['ONBOARD_DEVICE','ONBOARD_VPA','BIND_DEVICE','ALLOCATE_TO_BANK','ALLOCATE_TO_BRANCH','ALLOCATE_TO_MERCHANT']::TEXT[];
    	END IF;
    -- Compute final status
    RETURN QUERY
    SELECT 
        tor.row_id, 
        CASE 
            WHEN tor.onb_status = 0 OR tor.onboard_vpa_status = 0 OR tor.bind_device_status = 0 OR 
                 tor.allocate_bank_status = 0 OR tor.allocate_branch_status = 0 OR tor.allocate_merchant_status = 0 
            THEN 0 
            ELSE 1 
        END AS final_status,
        tor.device_id,
		action_steps,
        ARRAY[tor.onb_status, tor.onboard_vpa_status, tor.bind_device_status, 
              tor.allocate_bank_status, tor.allocate_branch_status, tor.allocate_merchant_status]::INTEGER[],
		ARRAY[]::registry.devices_msgs[],	  
        tor.onboard_device_response, 
        tor.onboard_vpa_response,
        tor.bind_device_response,
        tor.allocate_bank_response, 
        tor.allocate_branch_response, 
        tor.allocate_merchant_response
    FROM temp_onboard_result tor;
  END;
  END IF;
 END IF;
END;
$$ LANGUAGE plpgsql;


SELECT * FROM registry.onboard_device(
	 ARRAY[1,2]::INT[],
	'Allocated to Bank',
	'UPDATE_DEVICE',
	ARRAY[2,3]::INT[],
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
	
    ARRAY[]::TEXT[],      -- Bind device
    ARRAY[]::TEXT[],   -- Allocate to bank
    ARRAY[]::TEXT[],  -- Allocate to branch
    ARRAY[]::TEXT[],   -- Allocate to merchant
    ARRAY['abc','abc']::TEXT[],
    ARRAY[1111,1111]::INT[],
	ARRAY[true,true]
) 


INSERT INTO workflow.wfactions (ecode, ainfo, htype, isd, category, isvisible) VALUES
('ENABLE_SOUNDBOX', '{"endpoint":"/requests/wfhandler"}', 'api', false, 'device_actions', true)


INSERT INTO workflow.wfhsteps (ecode, hinfo)
VALUES
    ('ENABLE_SOUNDBOX', '[{"endpoint":"/registry/banks","sname":},{"endpoint":"/registry/banks","sname":}]'),