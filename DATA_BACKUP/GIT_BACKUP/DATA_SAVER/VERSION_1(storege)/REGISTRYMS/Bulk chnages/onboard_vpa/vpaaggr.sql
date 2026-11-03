CREATE OR REPLACE FUNCTION registry.onboard_vpa(
	rowid INT[],
    vpa_name TEXT[],
	d_name TEXT[],
	b_name TEXT[],
    event_bys TEXT[],
    eids INT[]
)
RETURNS TABLE (row_ids INTEGER, statuses INTEGER, messages TEXT[],vpa_id VARCHAR) AS
$$
DECLARE
    i INT;
BEGIN
  
        SELECT vid INTO vpa_id FROM registry.vpa_iterator(
			rowid,
    		vpa_name,
			d_name,
			b_name,
    		event_bys,   
            eids
        ); 

		RETURN QUERY 
        SELECT row_id,status,msgs::TEXT[],vpa_id FROM registry.sb_iterator(
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
END;
$$ LANGUAGE plpgsql;


SELECT * FROM registry.onboard_vpa(
	ARRAY[1,2],
    ARRAY['vpa6', 'vpa5'],  
	ARRAY['device_201','device_333'],
	ARRAY['bank_1', 'bank_1'], 
    ARRAY['ui1', 'ip1'], 
    ARRAY[28, 28]
);


---------------------REESULTS ONLY BIND DEVICE


"row_ids"	"statuses"	"messages"	"vpa_id"
1	0	"{DEVICE_ALREADY_BINDED}"	"vpa6"
2	0	"{INVALID_DEVICE}"	"vpa6"