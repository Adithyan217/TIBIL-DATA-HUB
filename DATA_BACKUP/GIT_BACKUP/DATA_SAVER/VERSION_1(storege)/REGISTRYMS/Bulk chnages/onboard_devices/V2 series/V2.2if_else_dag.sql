------------------ Single Temp table


CREATE OR REPLACE FUNCTION registry.onboard_device(
    onboard_status VARCHAR,
    allocation VARCHAR,
    rowid INT[],
    mf_name TEXT[],
    d_names TEXT[],
    md_name TEXT[],
    f_name TEXT[],
    imei TEXT[],
    vpa TEXT[],      -- Bind device
    b_name TEXT[],   -- Allocate to bank
    br_name TEXT[],  -- Allocate to branch
    m_name TEXT[],   -- Allocate to merchant
    event_bys TEXT[],
    eids INT[]
) 
RETURNS TABLE (
    a_row_id INTEGER, 
    final_status INTEGER, 
    event_response VARCHAR,
    steps TEXT[],
    step_status INTEGER[],
    onboard_devices_response registry.devices_msgs[],
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

  IF onboard_status = 'inventory' THEN
        RETURN QUERY 
        SELECT row_id, status, did,ARRAY[]::TEXT[],ARRAY[]::INTEGER[], msg,ARRAY[]::registry.vpa_msgs[], ARRAY[]::registry.sb_msgs[],ARRAY[]::registry.sb_msgs[], ARRAY[]::registry.sb_msgs[], ARRAY[]::registry.sb_msgs[] 
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
  ELSIF onboard_status = 'allocated' THEN
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
    
     
        IF allocation = 'allocate_to_bank'  THEN

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

		END IF;
        IF allocation = 'allocate_to_branch' THEN
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
		
        IF allocation = 'allocate_to_merchant' THEN
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
			action_steps := ARRAY['ONBOARD_DEVICES','ONBOARD_VPA','BIND_DEVICE','ALLOCATE_TO_BANK','ALLOCATE_TO_BRANCH','ALLOCATE_TO_MERCHANT']::TEXT[];
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
        tor.onboard_device_response, 
        tor.onboard_vpa_response,
        tor.bind_device_response,
        tor.allocate_bank_response, 
        tor.allocate_branch_response, 
        tor.allocate_merchant_response
    FROM temp_onboard_result tor;
  END;
  END IF;
END;
$$ LANGUAGE plpgsql;

EXPLAIN ANALYZE
SELECT * FROM registry.onboard_device(
    'allocated',
	'allocate_to_merchant',
    ARRAY[1,2]::INT[],
    ARRAY['mf_1','mf_1']::TEXT[],
    ARRAY['device_33','device_1011']::TEXT[],
    ARRAY['model_1','model_1']::TEXT[],
    ARRAY['firmware_1','firmware_1']::TEXT[],
    ARRAY['123456789abc33','1234567891e']::TEXT[],
    ARRAY['vpa@aqz133','vpa@aqz11']::TEXT[],      -- Bind device
    ARRAY['bank_1','bank_1']::TEXT[],   -- Allocate to bank
    ARRAY['branch_1','branch_1']::TEXT[],  -- Allocate to branch
    ARRAY['merchant_10','merchant_11']::TEXT[],   -- Allocate to merchant
    ARRAY['abc','abc']::TEXT[],
    ARRAY[1111,1111]::INT[]
) 