CREATE OR REPLACE FUNCTION registry.onboard_device(
    onboard_status VARCHAR,
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
BEGIN
    IF onboard_status = 'inventory' THEN
        RETURN QUERY 
        SELECT row_id, status, msg, ARRAY[]::registry.sb_msgs[],ARRAY[]::registry.sb_msgs[], ARRAY[]::registry.sb_msgs[], ARRAY[]::registry.sb_msgs[], did 
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

            CREATE TEMP TABLE temp_onboard_devcie_result (
		    row_id INTEGER, 
            onb_status INTEGER,
            onboard_device_response registry.devices_msgs[],
            device_id VARCHAR
            ) ON COMMIT DROP;
    
            INSERT INTO temp_onboard_devcie_result
            SELECT row_id,status,msg,did  FROM registry.device_iterator(
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

            --Onboard VPA
            CREATE TEMP TABLE temp_onboard_vpa_result (
                row_id INTEGER,
                onb_status INTEGER,
                onboard_vpa_response registry.vpa_msgs[]
            )
            ON COMMIT DROP;

            INSERT INTO temp_onboard_vpa_result
            SELECT row_id,status,msg FROM registry.vpa_iterator(
                rowid,
                vpa,
                d_names,
                b_name,
                event_bys,
                eids
            );
            -- Bind Device
            CREATE TEMP TABLE temp_bind_device_result (
            row_id INTEGER,
            sb_status INTEGER,
            bind_device_response registry.sb_msgs[]
            ) ON COMMIT DROP;

            INSERT INTO temp_bind_device_result
            SELECT row_id,status,msgs FROM registry.sb_iterator(
                rowid,
                'BIND_DEVICE',
                vpa,    
                d_names,
                ARRAY[]::TEXT[],
                ARRAY[]::TEXT[],
                ARRAY[]::TEXT[],
                event_bys,
                eids
            );
            
            -- Allocate to bank
            CREATE TEMP TABLE temp_allocate_bank_result (
            row_id INTEGER,
            sb_status INTEGER,
            allocate_bank_response registry.sb_msgs[]
            ) ON COMMIT DROP;


            INSERT INTO temp_allocate_bank_result
            SELECT row_id,status,msgs FROM registry.sb_iterator(
                rowid,
                'ALLOCATE_TO_BANK',
                ARRAY[]::TEXT[],    
                d_names,
                b_name,
                ARRAY[]::TEXT[],
                ARRAY[]::TEXT[],
                event_bys,
                eids
            );

            -- Allocate to branch
            CREATE TEMP TABLE temp_allocate_branch_result (
            row_id INTEGER,
            sb_status INTEGER,
            allocate_branch_response registry.sb_msgs[]
            ) ON COMMIT DROP;

            INSERT INTO temp_allocate_branch_result
            SELECT row_id,status,msgs FROM registry.sb_iterator(
                rowid,
                'ALLOCATE_TO_BRANCH',
                ARRAY[]::TEXT[],    
                d_names,
                ARRAY[]::TEXT[],
                br_name,
                ARRAY[]::TEXT[],
                event_bys,
                eids
            );

            -- Allocate to merchant
            CREATE TEMP TABLE temp_allocate_merchant_result (
            row_id INTEGER,
            sb_status INTEGER,
            allocate_merchant_response registry.sb_msgs[]
            ) ON COMMIT DROP;

            INSERT INTO temp_allocate_merchant_result
            SELECT row_id,status,msgs FROM registry.sb_iterator(
                rowid,
                'ALLOCATE_TO_MERCHANT',
                ARRAY[]::TEXT[],    
                d_names,
                ARRAY[]::TEXT[],
                ARRAY[]::TEXT[],
                m_name,
                event_bys,
                eids
            );

            RETURN QUERY
            SELECT 
                odr.row_id, 
                CASE 
                WHEN odr.onb_status = 0 OR ovr.onb_status = 0 OR bdr.sb_status = 0 OR abr.sb_status = 0 OR abrr.sb_status = 0 OR amr.sb_status = 0 THEN 0 
                ELSE 1 
       	        END AS final_status,
                odr.device_id,
                ARRAY['ONBOARD_DEVICES','ONBOARD_VPA','BIND_DEVICE','ALLOCATE_TO_BANK','ALLOCATE_TO_BRANCH','ALLOCATE_TO_MERCHANT']::TEXT[],
                ARRAY[odr.onb_status,ovr.onb_status,bdr.sb_status,abr.sb_status,abrr.sb_status,amr.sb_status]::INTEGER[], 
                odr.onboard_device_response, 
                ovr.onboard_vpa_response,
                bdr.bind_device_response,
                abr.allocate_bank_response, 
                abrr.allocate_branch_response, 
                amr.allocate_merchant_response
                
            FROM temp_onboard_devcie_result odr
            JOIN temp_onboard_vpa_result ovr ON odr.row_id = ovr.row_id
            JOIN temp_bind_device_result bdr ON odr.row_id = bdr.row_id
            JOIN temp_allocate_bank_result abr ON odr.row_id = abr.row_id
            JOIN temp_allocate_branch_result abrr ON odr.row_id = abrr.row_id
            JOIN temp_allocate_merchant_result amr ON odr.row_id = amr.row_id;
		END;
    END IF;
    

END;
$$ LANGUAGE plpgsql;


SELECT * FROM registry.onboard_device(
    'allocated',
    ARRAY[1,2]::INT[],
    ARRAY['mf_1','mf_1']::TEXT[],
    ARRAY['device_12','device_1011']::TEXT[],
    ARRAY['model_1','model_1']::TEXT[],
    ARRAY['firmware_1','firmware_1']::TEXT[],
    ARRAY['123456789abc12','123456789e']::TEXT[],
    ARRAY['vpa@aqz10','vpa@aqz11']::TEXT[],      -- Bind device
    ARRAY['bank_1','bank_1']::TEXT[],   -- Allocate to bank
    ARRAY['branch_1','branch_1']::TEXT[],  -- Allocate to branch
    ARRAY['merchant_10','merchant_11']::TEXT[],   -- Allocate to merchant
    ARRAY['abc','abc']::TEXT[],
    ARRAY[1111,1111]::INT[]
) 
