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
    row_id INTEGER, 
    status INTEGER, 
    event TEXT[], 
    msgs TEXT[][],  -- Converted to TEXT[][] to support both msg types
    did VARCHAR
) AS
$$
DECLARE
    device_result RECORD;
    bind_result RECORD;
    bank_result RECORD;
    branch_result RECORD;
    merchant_result RECORD;

    final_status INTEGER;
    event_names TEXT[] := ARRAY['DEVICE_ONBOARD', 'BIND_DEVICE', 'ALLOCATE_TO_BANK', 'ALLOCATE_TO_BRANCH', 'ALLOCATE_TO_MERCHANT'];
    all_msgs TEXT[][]; -- Using TEXT to unify different ENUM message types

    unique_row_id INTEGER;
    unique_did VARCHAR;
BEGIN
    -- Loop through each row ID in bulk input
    FOR unique_row_id IN SELECT unnest(rowid) LOOP
        -- Initialize messages array (5 empty sub-arrays)
        all_msgs := ARRAY[
            ARRAY[]::TEXT[], 
            ARRAY[]::TEXT[], 
            ARRAY[]::TEXT[], 
            ARRAY[]::TEXT[], 
            ARRAY[]::TEXT[]
        ];
        final_status := 1;  -- Assume success

        -- Onboard Device (registry.devices_msgs[])
        FOR device_result IN 
            SELECT * FROM registry.device_iterator(
                ARRAY[unique_row_id], 
                ARRAY[]::INT[], 
                mf_name,
                d_names,
                md_name,
                f_name,
                imei,
                event_bys,   
                eids
            )
        LOOP
            all_msgs[1] := ARRAY(SELECT unnest(device_result.msg)::TEXT);  -- Convert ENUM to TEXT
            unique_did := device_result.did;  -- Capture DID
            IF device_result.status = 0 THEN
                final_status := 0;
            END IF;
        END LOOP;

        -- If onboard_status = 'allocated', process further steps
        IF onboard_status = 'allocated' THEN
            -- Bind Device (registry.sb_msgs[])
            FOR bind_result IN 
                SELECT * FROM registry.sb_iterator(
                    ARRAY[unique_row_id],
                    'BIND_DEVICE',
                    vpa,	
                    d_names,
                    ARRAY[]::TEXT[],
                    ARRAY[]::TEXT[],
                    ARRAY[]::TEXT[],
                    event_bys,
                    eids
                )
            LOOP
                all_msgs[2] := ARRAY(SELECT unnest(bind_result.msgs)::TEXT);
                IF bind_result.status = 0 THEN
                    final_status := 0;
                END IF;
            END LOOP;

            -- Allocate to Bank (registry.sb_msgs[])
            FOR bank_result IN 
                SELECT * FROM registry.sb_iterator(
                    ARRAY[unique_row_id],
                    'ALLOCATE_TO_BANK',
                    ARRAY[]::TEXT[],	
                    d_names,
                    b_name,
                    ARRAY[]::TEXT[],
                    ARRAY[]::TEXT[],
                    event_bys,
                    eids
                )
            LOOP
                all_msgs[3] := ARRAY(SELECT unnest(bank_result.msgs)::TEXT);
                IF bank_result.status = 0 THEN
                    final_status := 0;
                END IF;
            END LOOP;

            -- Allocate to Branch (registry.sb_msgs[])
            FOR branch_result IN 
                SELECT * FROM registry.sb_iterator(
                    ARRAY[unique_row_id],
                    'ALLOCATE_TO_BRANCH',
                    ARRAY[]::TEXT[],	
                    d_names,
                    ARRAY[]::TEXT[],
                    br_name,
                    ARRAY[]::TEXT[],
                    event_bys,
                    eids
                )
            LOOP
                all_msgs[4] := ARRAY(SELECT unnest(branch_result.msgs)::TEXT);
                IF branch_result.status = 0 THEN
                    final_status := 0;
                END IF;
            END LOOP;

            -- Allocate to Merchant (registry.sb_msgs[])
            FOR merchant_result IN 
                SELECT * FROM registry.sb_iterator(
                    ARRAY[unique_row_id],
                    'ALLOCATE_TO_MERCHANT',
                    ARRAY[]::TEXT[],	
                    d_names,
                    ARRAY[]::TEXT[],
                    ARRAY[]::TEXT[],
                    m_name,
                    event_bys,
                    eids
                )
            LOOP
                all_msgs[5] := ARRAY(SELECT unnest(merchant_result.msgs)::TEXT);
                IF merchant_result.status = 0 THEN
                    final_status := 0;
                END IF;
            END LOOP;
        END IF;

        -- Return one row per unique_row_id
        RETURN QUERY 
        SELECT 
            unique_row_id, 
            final_status, 
            event_names, 
            all_msgs, 
            unique_did;
    END LOOP;
END;
$$ LANGUAGE plpgsql;



SELECT * FROM registry.onboard_device(
    'allocated',
    ARRAY[1,2]::INT[],
    ARRAY['mf_1','mf_1']::TEXT[],
    ARRAY['device_8','device_9']::TEXT[],
    ARRAY['model_1','model_1']::TEXT[],
    ARRAY['firmware_1','firmware_1']::TEXT[],
    ARRAY['91234567891','9123456789418']::TEXT[],
    ARRAY['vpa@aqz5','vpa@aqz6']::TEXT[],      -- Bind device
    ARRAY['bank_1','bank_1']::TEXT[],   -- Allocate to bank
    ARRAY['branch_1','branch_1']::TEXT[],  -- Allocate to branch
    ARRAY['merchant_2','merchant_2']::TEXT[],   -- Allocate to merchant
    ARRAY['abc','abc']::TEXT[],
    ARRAY[1111,1111]::INT[]
) 


-------------------RESULTS (ALL MSG IN ONE ARRAY)   -------------------

"row_id"	"status"	"event"	"msgs"	"did"
1	0	"{DEVICE_ONBOARD,BIND_DEVICE,ALLOCATE_TO_BANK,ALLOCATE_TO_BRANCH,ALLOCATE_TO_MERCHANT}"	"{""{DEVICE_REPEATED,IMEI_REPEATED}"",""{SUCCESS}"",""{SUCCESS}"",""{SUCCESS}"",""{SUCCESS}""}"	
2	0	"{DEVICE_ONBOARD,BIND_DEVICE,ALLOCATE_TO_BANK,ALLOCATE_TO_BRANCH,ALLOCATE_TO_MERCHANT}"	"{""{DEVICE_REPEATED,IMEI_REPEATED}"",""{SUCCESS}"",""{SUCCESS}"",""{SUCCESS}"",""{SUCCESS}""}"	