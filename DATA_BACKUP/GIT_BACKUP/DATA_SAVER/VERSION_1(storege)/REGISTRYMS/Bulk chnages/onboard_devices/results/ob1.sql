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
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.devices_msgs[], did VARCHAR) AS
$$
DECLARE
    -- allocatebankmsgs TEXT[];
    -- allocatebranchmsgs TEXT[];
    -- allocatemerchantmsgs TEXT[];

    -- allocatebanksts INTEGER;
    -- allocatebranchsts INTEGER;
    -- allocatemerchantsts INTEGER;
BEGIN
    IF onboard_status = 'inventory' THEN
        RETURN QUERY 
        SELECT * FROM registry.device_iterator(
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
            -- Onboard device
            RETURN QUERY 
            SELECT * FROM registry.device_iterator(
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
            PERFORM * FROM registry.sb_iterator(
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
            PERFORM * FROM registry.sb_iterator(
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
            PERFORM * FROM registry.sb_iterator(
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
            PERFORM * FROM registry.sb_iterator(
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
		END;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;





SELECT * FROM registry.onboard_device(
    'allocate',
    ARRAY[1]::INT[],
    ARRAY['mf_1']::TEXT[],
    ARRAY['device_1']::TEXT[],
    ARRAY['model_1']::TEXT[],
    ARRAY['firmware_1']::TEXT[],
    ARRAY['123456789']::TEXT[],
    ARRAY['vpa@aqz2']::TEXT[],      -- Bind device
    ARRAY['bank_1']::TEXT[],   -- Allocate to bank
    ARRAY['branch_1']::TEXT[],  -- Allocate to branch
    ARRAY['merchant_2']::TEXT[],   -- Allocate to merchant
    ARRAY['abc']::TEXT[],
    ARRAY[1111]::INT[]
) 



