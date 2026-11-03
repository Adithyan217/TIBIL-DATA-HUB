CREATE OR REPLACE FUNCTION registry.onboard_vpa(
    rowid INT[],
    vpa_name TEXT[],
    d_name TEXT[],
    b_name TEXT[],
    event_bys TEXT[],
    eids INT[]
)
RETURNS TABLE (row_ids INTEGER, statuses INTEGER, sb_messages registry.sb_msgs[][],vpa_messages registry.vpa_msgs[][], vpa_id VARCHAR) AS
$$
DECLARE
BEGIN
    -- Temporary table for vpa_iterator result
    CREATE TEMP TABLE temp_vpa_result (
		row_ids INTEGER, 
        vid VARCHAR,
        vpa_msgs registry.vpa_msgs[]
    ) ON COMMIT DROP;
    
    -- Store the result from registry.vpa_iterator
    INSERT INTO temp_vpa_result
    SELECT row_id,vid, msg FROM registry.vpa_iterator(
        rowid,
        vpa_name,
        d_name,
        b_name,
        event_bys,
        eids
    );


    -- Temporary table for sb_iterator result
    CREATE TEMP TABLE temp_sb_result (
        row_ids INTEGER, 
        statuses INTEGER, 
        sb_msgs registry.sb_msgs[]
    ) ON COMMIT DROP;

    -- Store the result from registry.sb_iterator
    INSERT INTO temp_sb_result
    SELECT row_id, status, msgs FROM registry.sb_iterator(
        rowid,
        'BIND_DEVICE',
        vpa_name,    
        d_name,
        ARRAY[]::TEXT[],
        ARRAY[]::TEXT[],
        ARRAY[]::TEXT[],
        event_bys,
        eids
    );

    -- Return the combined result with messages from both tables
    RETURN QUERY 
    SELECT sb.row_ids, sb.statuses, 
           sb.sb_msgs, 
		   vp.vpa_msgs, 
            vp.vid
    FROM temp_sb_result sb
    JOIN temp_vpa_result vp ON sb.row_ids=vp.row_ids;
    
END;
$$ LANGUAGE plpgsql;



SELECT * FROM registry.onboard_vpa(
	ARRAY[1,2],
    ARRAY['vpa6', 'vpa5'],  
	ARRAY['device_201','device_3334'],
	ARRAY['bank_1', 'bank_1'], 
    ARRAY['ui1', 'ip1'], 
    ARRAY[28, 28]
);













----------------------------------RESULTS


"row_ids"	"statuses"	"sb_messages"	"vpa_messages"	"vpa_id"
1	0	"{DEVICE_ALREADY_BINDED}"	"{DEVICE_HAS_VPA}"	"vpa6"
2	0	"{INVALID_DEVICE}"	"{INVALID_DEVICE}"	"vpa5"