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
    device_ids VARCHAR
) AS
$$
DECLARE

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

            CREATE TEMP TABLE temp_onboard_result (
		    row_ids INTEGER, 
            statuses INTEGER,
            onboard_msgs registry.devices_msgs[],
            device_id VARCHAR
            ) ON COMMIT DROP;
    
            INSERT INTO temp_onboard_result
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
            

            CREATE TEMP TABLE temp_bind_device_result (
            row_ids INTEGER,
            statuses INTEGER,
            bind_device_msgs registry.sb_msgs[]
            ) ON COMMIT DROP;
            -- Bind Device
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
            

            CREATE TEMP TABLE temp_allocate_bank_result (
            row_ids INTEGER,
            statuses INTEGER,
            allocate_bank_msgs registry.sb_msgs[]
            ) ON COMMIT DROP;

            -- Allocate to bank
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

            CREATE TEMP TABLE temp_allocate_branch_result (
            row_ids INTEGER,
            statuses INTEGER,
            allocate_branch_msgs registry.sb_msgs[]
            ) ON COMMIT DROP;

            -- Allocate to branch
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

            CREATE TEMP TABLE temp_allocate_merchant_result (
            row_ids INTEGER,
            statuses INTEGER,
            allocate_merchant_msgs registry.sb_msgs[]
            ) ON COMMIT DROP;

            -- Allocate to merchant
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
                tor.row_ids, 
                tor.statuses, 
                tor.onboard_msgs, 
                bdr.bind_device_msgs,
                abr.allocate_bank_msgs, 
                abrr.allocate_branch_msgs, 
                amr.allocate_merchant_msgs, 
                tor.device_id
            FROM temp_onboard_result tor
            JOIN temp_bind_device_result bdr ON tor.row_ids = bdr.row_ids
            JOIN temp_allocate_bank_result abr ON tor.row_ids = abr.row_ids
            JOIN temp_allocate_branch_result abrr ON tor.row_ids = abrr.row_ids
            JOIN temp_allocate_merchant_result amr ON tor.row_ids = amr.row_ids;
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


------------------RESULT MSG FOR EACH ACTION SEPERATLY---------------------

"row_ids"	"statuses"	"onboard_msgs"	"bind_device_msgs"	"allocate_bank_msgs"	"allocate_branch_msgs"	"allocate_merchant_msgs"	"device_ids"
1	0	"{DEVICE_REPEATED,IMEI_REPEATED}"	"{INVALID_VPA}"	"{BANK_ALREADY_ALLOCATED}"	"{BRANCH_ALREADY_ALLOCATED}"	"{UNABLE_TO_ALLOCATE}"	
2	0	"{IMEI_REPEATED}"	"{INVALID_DEVICE,INVALID_VPA}"	"{INVALID_DEVICE}"	"{INVALID_DEVICE}"	"{INVALID_DEVICE}"	
