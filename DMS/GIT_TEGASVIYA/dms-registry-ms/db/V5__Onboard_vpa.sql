ALTER TABLE registry.vpa 
ADD COLUMN did INT UNIQUE,
ADD CONSTRAINT fk_devices_did FOREIGN KEY (did) REFERENCES registry.devices(did);

ALTER TABLE registry.vpa_v
ADD COLUMN did INT ,
ADD CONSTRAINT fk_devices_did FOREIGN KEY (did) REFERENCES registry.devices(did);

CREATE INDEX IF NOT EXISTS idx_vpa_did
ON registry.vpa(did);

CREATE INDEX IF NOT EXISTS idx_vpa_v_did
ON registry.vpa_v(did);

ALTER TYPE registry.vpa_msgs ADD VALUE 'INVALID_DEVICE';
ALTER TYPE registry.vpa_msgs ADD VALUE 'DEVICE_HAS_VPA';
ALTER TYPE registry.vpa_msgs ADD VALUE 'DEVICE_REPEATED';

-------------ONBOARD FUNCTION----------------

DROP FUNCTION IF EXISTS registry.vpa_validator;

DROP FUNCTION IF EXISTS registry.vpa_validator_writer;

DROP FUNCTION IF EXISTS registry.vpa_iterator;



CREATE OR REPLACE FUNCTION registry.vpa_validator(vpa_name VARCHAR,b_id INTEGER,d_id INTEGER) 
RETURNS registry.vpa_msgs[] AS $$
DECLARE
messages registry.vpa_msgs[];
BEGIN
   	IF EXISTS (SELECT 1 FROM registry.vpa WHERE vpa = vpa_name ) THEN
        messages := array_append(messages, 'VPA_REPEATED'::registry.vpa_msgs);
    END IF;

	IF EXISTS (SELECT 1 FROM registry.vpa WHERE did = d_id ) THEN
        messages := array_append(messages, 'DEVICE_REPEATED'::registry.vpa_msgs);
    END IF;
	
	IF NOT EXISTS (SELECT 1 FROM registry.banks WHERE bid = b_id AND isd = 'false') THEN
    	messages := array_append(messages, 'INVALID_BANK'::registry.vpa_msgs);
	END IF;

	IF NOT EXISTS (SELECT 1 FROM registry.devices WHERE did = d_id AND isd = 'false') THEN
    	messages := array_append(messages, 'INVALID_DEVICE'::registry.vpa_msgs);
	END IF;

	IF EXISTS (SELECT 1 FROM registry.sb WHERE did = d_id AND vid IS NOT NULL AND isd = 'false') THEN
    	messages := array_append(messages, 'DEVICE_HAS_VPA'::registry.vpa_msgs);
	END IF;

    RETURN messages;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.vpa_validator_writer(
    rowid INTEGER,
    _vpa VARCHAR,
	d_name VARCHAR,
	b_name VARCHAR,
    e_by VARCHAR,
    e_id INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.vpa_msgs[],vpa_name VARCHAR) AS $$
DECLARE
    v_evt registry.vevts := 'VPA_ONBOARDED';
	validator_result registry.vpa_msgs[];
    b_id INTEGER := NULL;
    vpa_ VARCHAR := NULL;
	d_id INTEGER := NULL;
BEGIN
    SELECT bid INTO b_id FROM registry.banks WHERE bname = b_name;
	SELECT did INTO d_id FROM registry.devices WHERE dname = d_name;

    validator_result := registry.vpa_validator(_vpa,b_id,d_id);
	
    IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,_vpa;
		RETURN;
	END IF;	
	
    INSERT INTO registry.vpa (eid, vevt, eby, vpa,bid,did)
    VALUES (e_id, v_evt, e_by, _vpa,b_id,d_id)
    RETURNING vpa INTO vpa_;
	RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_INSERT']::registry.vpa_msgs[],vpa_;	
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registry.vpa_iterator(
	rowid INT[],
    vpa_name TEXT[],
	d_name TEXT[],
	b_name TEXT[],
    event_bys TEXT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.vpa_msgs[],vid VARCHAR) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(rowid, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.vpa_validator_writer(
			rowid[i],
    		vpa_name[i],
			d_name[i],
			b_name[i],
    		event_bys[i],   
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;



------------------------------AGGREGATOR FUNCTION-------------------


CREATE OR REPLACE FUNCTION registry.onboard_vpa(
    rowid INT[],
    vpa_name TEXT[],
    d_name TEXT[],
    b_name TEXT[],
    event_bys TEXT[],
    eids INT[]
)
RETURNS TABLE (
    row_id INTEGER, 
    status INTEGER, 
    response VARCHAR, 
    steps TEXT[],
    step_status INTEGER[], 
    onboard_vpa_response registry.vpa_msgs[][], 
    bind_device_response registry.sb_msgs[][]
) AS
$$
DECLARE
    f_status INTEGER := 0;
BEGIN
    CREATE TEMP TABLE temp_result (
        row_ids INTEGER, 
        create_status INTEGER,
        vid VARCHAR,
        vpa_msgs registry.vpa_msgs[],
		bind_status INTEGER, 
        sb_msgs registry.sb_msgs[]
    ) ON COMMIT DROP;
    
    INSERT INTO temp_result (row_ids, create_status, vid, vpa_msgs)
    SELECT ov.row_id, ov.status, vid, msg FROM registry.vpa_iterator(
        rowid,
        vpa_name,
        d_name,
        b_name,
        event_bys,
        eids
    ) AS ov;


    UPDATE temp_result SET bind_status = sb_result.status, sb_msgs = sb_result.msgs
    FROM (
        SELECT uv.row_id, uv.status, msgs FROM registry.sb_iterator(
            rowid,
            'BIND_DEVICE',
            vpa_name,    
            d_name,
            ARRAY[]::TEXT[],
            ARRAY[]::TEXT[],
            ARRAY[]::TEXT[],
            event_bys,
            eids
        ) AS uv
    ) AS sb_result
    WHERE temp_result.row_ids = sb_result.row_id;
    
    RETURN QUERY 
    SELECT tr.row_ids,
           CASE 
           WHEN tr.create_status = 0 OR tr.bind_status = 0 THEN 0 
           ELSE 1 
       	   END AS final_status,
           tr.vid,
           ARRAY['ONBOARD_VPA', 'BIND_DEVICE']::TEXT[],
           ARRAY[tr.create_status, tr.bind_status],
           tr.vpa_msgs,
           tr.sb_msgs
    FROM temp_result tr;
    
    
END;
$$ LANGUAGE plpgsql;