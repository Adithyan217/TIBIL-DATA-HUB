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
    row_ids INTEGER, 
    statuses INTEGER, 
    onboard_msgs registry.devices_msgs[],
	bind_device_msgs registry.sb_msgs[],
    allocate_bank_msgs registry.sb_msgs[],
    allocate_branch_msgs registry.sb_msgs[],
    allocate_merchant_msgs registry.sb_msgs[],
    device_ids TEXT
) AS
$$
DECLARE
    onboard_msgs registry.devices_msgs[];
	bind_device_msgs registry.sb_msgs[];
    allocate_bank_msgs registry.sb_msgs[];
    allocate_branch_msgs registry.sb_msgs[];
    allocate_merchant_msgs registry.sb_msgs[];
	device_id VARCHAR[];
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
		 FOR i IN 1..array_length(rowid, 1) LOOP
            -- Onboard device
            SELECT array_agg(msg), array_agg(did) INTO onboard_msgs, device_id  FROM registry.device_iterator(
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
            
            -- Bind Device
            SELECT array_agg(msgs) INTO bind_device_msgs FROM registry.sb_iterator(
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
            SELECT array_agg(msgs) INTO allocate_bank_msgs FROM registry.sb_iterator(
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
            SELECT array_agg(msgs) INTO allocate_branch_msgs FROM registry.sb_iterator(
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
            SELECT array_agg(msgs) INTO allocate_merchant_msgs FROM registry.sb_iterator(
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
        		rowid[i], 
        		1, 
        		onboard_msgs, 
				bind_device_msgs,
        		allocate_bank_msgs, 
        		allocate_branch_msgs, 
        		allocate_merchant_msgs, 
        		d_names[i];
         END LOOP;
		END;
    END IF;
    

END;
$$ LANGUAGE plpgsql;


SELECT * FROM registry.onboard_device(
    'allocated',
    ARRAY[1,2]::INT[],
    ARRAY['mf_1','mf_1']::TEXT[],
    ARRAY['device_10','device_11']::TEXT[],
    ARRAY['model_1','model_1']::TEXT[],
    ARRAY['firmware_1','firmware_1']::TEXT[],
    ARRAY['123456789e','123456789e']::TEXT[],
    ARRAY['vpa@aqz10','vpa@aqz11']::TEXT[],      -- Bind device
    ARRAY['bank_1','bank_1']::TEXT[],   -- Allocate to bank
    ARRAY['branch_1','branch_1']::TEXT[],  -- Allocate to branch
    ARRAY['merchant_10','merchant_11']::TEXT[],   -- Allocate to merchant
    ARRAY['abc','abc']::TEXT[],
    ARRAY[1111,1111]::INT[]
) 

------------------------------RESULTS--------------------------------

"row_ids"	"statuses"	"onboard_msgs"	"bind_device_msgs"	"allocate_bank_msgs"	"allocate_branch_msgs"	"allocate_merchant_msgs"	"device_ids"
1	1	"{{DEVICE_REPEATED,IMEI_REPEATED},{DEVICE_REPEATED,IMEI_REPEATED}}"	"{{SUCCESS},{SUCCESS}}"	"{{SUCCESS},{SUCCESS}}"	"{{SUCCESS},{SUCCESS}}"	"{{SUCCESS},{SUCCESS}}"	"device_10"
2	1	"{{DEVICE_REPEATED,IMEI_REPEATED},{DEVICE_REPEATED,IMEI_REPEATED}}"	"{{SUCCESS},{SUCCESS}}"	"{{SUCCESS},{SUCCESS}}"	"{{SUCCESS},{SUCCESS}}"	"{{SUCCESS},{SUCCESS}}"	"device_11"