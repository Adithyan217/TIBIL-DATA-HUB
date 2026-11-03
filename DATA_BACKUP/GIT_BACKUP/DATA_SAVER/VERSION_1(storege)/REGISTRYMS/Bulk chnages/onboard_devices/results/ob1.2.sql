CREATE OR REPLACE FUNCTION registry.onboard_device(
    onboard_status VARCHAR,
    rowid INT[],
    mf_name TEXT[],
    d_names TEXT[],
    md_name TEXT[],
    f_name TEXT[],
    imei TEXT[],
    vpa TEXT[],      
    b_name TEXT[],   
    br_name TEXT[],  
    m_name TEXT[],   
    event_bys TEXT[],
    eids INT[]
) 
RETURNS SETOF registry.device_onboard_result AS
$$
DECLARE
    result registry.device_onboard_result;
BEGIN
    IF onboard_status = 'inventory' THEN
        FOR result IN 
            SELECT row_id, status, msg::TEXT[], did FROM registry.device_iterator(
                rowid,
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
            RETURN NEXT result;
        END LOOP;
    
    ELSIF onboard_status = 'allocated' THEN
        -- Onboard Device
        FOR result IN 
            SELECT row_id, status, msg::TEXT[], did FROM registry.device_iterator(
                rowid,
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
            RETURN NEXT result;
        END LOOP;

        -- Bind Device
        FOR result IN 
            SELECT row_id, status, msgs::TEXT[], NULL::VARCHAR FROM registry.sb_iterator(
                rowid, 'BIND_DEVICE', vpa, d_names, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], event_bys, eids
            )
        LOOP
            RETURN NEXT result;
        END LOOP;

        -- Allocate to Bank
        FOR result IN 
            SELECT row_id, status, msgs::TEXT[], NULL::VARCHAR FROM registry.sb_iterator(
                rowid, 'ALLOCATE_TO_BANK', ARRAY[]::TEXT[], d_names, b_name, ARRAY[]::TEXT[], ARRAY[]::TEXT[], event_bys, eids
            )
        LOOP
            RETURN NEXT result;
        END LOOP;

        -- Allocate to Branch
        FOR result IN 
            SELECT row_id, status, msgs::TEXT[], NULL::VARCHAR FROM registry.sb_iterator(
                rowid, 'ALLOCATE_TO_BRANCH', ARRAY[]::TEXT[], d_names, ARRAY[]::TEXT[], br_name, ARRAY[]::TEXT[], event_bys, eids
            )
        LOOP
            RETURN NEXT result;
        END LOOP;

        -- Allocate to Merchant
        FOR result IN 
            SELECT row_id, status, msgs::TEXT[], NULL::VARCHAR FROM registry.sb_iterator(
                rowid, 'ALLOCATE_TO_MERCHANT', ARRAY[]::TEXT[], d_names, ARRAY[]::TEXT[], ARRAY[]::TEXT[], m_name, event_bys, eids
            )
        LOOP
            RETURN NEXT result;
        END LOOP;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;



SELECT * FROM registry.onboard_device(
    'allocated',
    ARRAY[1,2]::INT[],
    ARRAY['mf_1']::TEXT[],
    ARRAY['device_20']::TEXT[],
    ARRAY['model_1']::TEXT[],
    ARRAY['firmware_1']::TEXT[],
    ARRAY['123456789111']::TEXT[],
    ARRAY['vpa@aqz2']::TEXT[],
    ARRAY['bank_1']::TEXT[],
    ARRAY['branch_1']::TEXT[],
    ARRAY['merchant_2']::TEXT[],
    ARRAY['abc','abc']::TEXT[],
    ARRAY[1111,11]::INT[]
);

CREATE TYPE registry.device_onboard_result AS (
    row_id INTEGER,
    status INTEGER,
    msg TEXT[],
    did VARCHAR
);

------------------------RESULTS 5 ROWS PER DEVICE/ROW_ID------------------------

"row_id"	"status"	"msg"	"did"
1	1	"{SUCCESS_INSERT}"	"device_201"
2	0	"{INVALID_FIRMWARE,INVALID_MF,INVALID_MODEL}"	
1	1	"{SUCCESS}"	
2	0	"{INVALID_DEVICE}"	
1	1	"{SUCCESS}"	
2	0	"{INVALID_BANK,INVALID_DEVICE}"	
1	1	"{SUCCESS}"	
2	0	"{INVALID_BRANCH,INVALID_DEVICE}"	
1	0	"{UNABLE_TO_ALLOCATE}"	
2	0	"{INVALID_MERCHANT,INVALID_DEVICE}"	