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
    row_id INTEGER, 
    status INTEGER, 
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
 IF event = 'UPDATE_DEVICE' OR event = 'ENABLE_SOUNDBOX' THEN
 		RETURN QUERY 
        SELECT up.row_id, up.status, did,ARRAY['UPDATE_DEVICE']::TEXT[],ARRAY[up.status]::INTEGER[], msg,ARRAY[]::registry.devices_msgs[],ARRAY[]::registry.vpa_msgs[], ARRAY[]::registry.sb_msgs[],ARRAY[]::registry.sb_msgs[], ARRAY[]::registry.sb_msgs[], ARRAY[]::registry.sb_msgs[] 
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
        ) AS up;
 ELSE 
  IF onboard_status = 'To Inventory' THEN
        RETURN QUERY 
        SELECT inv.row_id, inv.status, did,ARRAY['ONBOARD_DEVICE']::TEXT[],ARRAY[inv.status]::INTEGER[],ARRAY[]::registry.devices_msgs[], msg,ARRAY[]::registry.vpa_msgs[], ARRAY[]::registry.sb_msgs[],ARRAY[]::registry.sb_msgs[], ARRAY[]::registry.sb_msgs[], ARRAY[]::registry.sb_msgs[] 
        FROM registry.device_iterator(
            rowid,
            ARRAY[]::INT[], 
            mf_name,
            d_names,
            md_name,
            f_name,
            imei,
			sbe,
            event_bys,   
            eids
        ) AS inv;
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
    SELECT od.row_id, od.status, msg, did FROM registry.device_iterator(
        rowid,
        ARRAY[]::INT[], 
        mf_name,
        d_names,
        md_name,
        f_name,
        imei,
		sbe,
        event_bys,   
        eids
    )AS od;
    

    IF vpa IS NOT NULL AND cardinality(vpa) > 0 AND vpa[1] IS NOT NULL THEN
                -- Update with VPA onboarding results
                UPDATE temp_onboard_result tor
                SET onboard_vpa_status = vpa_result.status,
                    onboard_vpa_response = vpa_result.msg
                FROM (
                    SELECT ov.row_id, ov.status, msg FROM registry.vpa_iterator(
                        rowid,
                        vpa,
                        d_names,
                        b_name,
                        event_bys,
                        eids
                    ) AS ov
                ) AS vpa_result
                WHERE tor.row_id = vpa_result.row_id;

                -- Update with Bind Device results
                UPDATE temp_onboard_result tor
                SET bind_device_status = bind_result.status,
                    bind_device_response = bind_result.msgs
                FROM (
                    SELECT bd.row_id, bd.status, msgs FROM registry.sb_iterator(
                        rowid,
                        'BIND_DEVICE',
                        vpa,    
                        d_names,
                        ARRAY[]::TEXT[],
                        ARRAY[]::TEXT[],
                        ARRAY[]::TEXT[],
                        event_bys,
                        eids
                    ) AS bd
                ) AS bind_result
                WHERE tor.row_id = bind_result.row_id;
    END IF;           
     

            -- Update with Allocate to Bank results
            UPDATE temp_onboard_result tor
            SET allocate_bank_status = bank_result.status,
                allocate_bank_response = bank_result.msgs
            FROM (
                SELECT ab.row_id, ab.status, msgs FROM registry.sb_iterator(
                    rowid,
                    'ALLOCATE_TO_BANK',
                    ARRAY[]::TEXT[],    
                    d_names,
                    b_name,
                    ARRAY[]::TEXT[],
                    ARRAY[]::TEXT[],
                    event_bys,
                    eids
                ) AS ab
            ) AS bank_result
            WHERE tor.row_id = bank_result.row_id;
			action_steps := ARRAY['ONBOARD_DEVICES','ONBOARD_VPA','BIND_DEVICE','ALLOCATE_TO_BANK']::TEXT[];

        IF onboard_status = 'Allocated to Branch' OR onboard_status = 'Allocated to Merchant' THEN
            -- Update with Allocate to Branch results
            UPDATE temp_onboard_result tor
            SET allocate_branch_status = branch_result.status,
                allocate_branch_response = branch_result.msgs
            FROM (
                SELECT abr.row_id, abr.status, msgs FROM registry.sb_iterator(
                    rowid,
                    'ALLOCATE_TO_BRANCH',
                    ARRAY[]::TEXT[],    
                    d_names,
                    ARRAY[]::TEXT[],
                    br_name,
                    ARRAY[]::TEXT[],
                    event_bys,
                    eids
                ) AS abr
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
                SELECT am.row_id, am.status, msgs FROM registry.sb_iterator(
                    rowid,
                    'ALLOCATE_TO_MERCHANT',
                    ARRAY[]::TEXT[],    
                    d_names,
                    ARRAY[]::TEXT[],
                    ARRAY[]::TEXT[],
                    m_name,
                    event_bys,
                    eids
                ) AS am
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