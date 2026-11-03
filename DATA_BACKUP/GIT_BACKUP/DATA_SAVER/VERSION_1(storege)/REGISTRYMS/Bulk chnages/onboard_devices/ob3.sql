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
RETURNS TABLE (row_id INTEGER, statuses INT, onboardmsgs TEXT[],allocatebankmsgs TEXT[],allocatebranchmsgs TEXT[],allocatemerchantmsgs TEXT device_ids TEXT) AS
$$
DECLARE
    onboardmsgs TEXT[][];
    bindmsgs TEXT[][];
    allocatebankmsgs TEXT[][];
    allocatebranchmsgs TEXT[][];
    allocatemerchantmsgs TEXT[][];

    onboardsts INT[];
    bindsts INT[];
    allocatebanksts INT[];
    allocatebranchsts INT[];
    allocatemerchantsts INT[];

    device_id TEXT[];

    -- final_status INT;
    -- event_names TEXT[] := ARRAY['DEVICE_ONBOARD', 'BIND_DEVICE', 'ALLOCATE_TO_BANK', 'ALLOCATE_TO_BRANCH', 'ALLOCATE_TO_MERCHANT'];
    -- all_msgs TEXT[][]; 

    idx INTEGER;

BEGIN
    IF onboard_status = 'inventory' THEN 
        SELECT ARRAY_AGG(msg), ARRAY_AGG(status), ARRAY_AGG(did) 
        INTO onboardmsgs, onboardsts, device_id 
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
        RETURN QUERY SELECT rowid, onboardsts, ARRAY['ONBOARD_DEVICES']::TEXT[], onboardmsgs, d_names;

    ELSIF onboard_status = 'allocated' THEN
        BEGIN
            -- Onboard device 
            SELECT ARRAY_AGG(msg), ARRAY_AGG(status), ARRAY_AGG(did) 
            INTO onboardmsgs, onboardsts, device_id 
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
            
            -- Bind Device
            SELECT ARRAY_AGG(msgs), ARRAY_AGG(status) 
            INTO bindmsgs, bindsts 
            FROM registry.sb_iterator(
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
            SELECT ARRAY_AGG(msgs), ARRAY_AGG(status) 
            INTO allocatebankmsgs, allocatebanksts 
            FROM registry.sb_iterator(
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
            SELECT ARRAY_AGG(msgs), ARRAY_AGG(status) 
            INTO allocatebranchmsgs, allocatebranchsts 
            FROM registry.sb_iterator(
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
            SELECT ARRAY_AGG(msgs), ARRAY_AGG(status) 
            INTO allocatemerchantmsgs, allocatemerchantsts 
            FROM registry.sb_iterator(
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

	RETURN


END;
$$ LANGUAGE plpgsql;


SELECT * FROM registry.onboard_device(
    'allocated',
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
