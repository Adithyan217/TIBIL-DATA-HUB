CREATE OR REPLACE FUNCTION dmsr.device_validator(d_name VARCHAR,mf_id INTEGER,md_id INTEGER,f_id INTEGER ) 
RETURNS BOOLEAN AS $$
BEGIN
   	IF EXISTS (SELECT 1 FROM dmsr.devices WHERE dname = d_name ) THEN
        RETURN FALSE;
    END IF;
	
	IF NOT EXISTS (SELECT 1 FROM dmsr.mf WHERE mfid = mf_id AND isd = 'false') THEN
    	RETURN FALSE;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM dmsr.model WHERE mdid = md_id AND isd = 'false') THEN
    	RETURN FALSE;
	END IF;

	IF NOT EXISTS (SELECT 1 FROM dmsr.firmware WHERE fid = f_id AND isd = 'false') THEN
    	RETURN FALSE;
	END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION dmsr.device_validator_writer(
    rowid INTEGER,
	mfid INTEGER,
    dname VARCHAR,
    mdid INTEGER ,
    fid INTEGER,
    eby INTEGER,
    eid INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,d_id INTEGER) AS $$
DECLARE
    devt dmsr.devts := 'DEVICE_ONBOARDED';
	d_id INTEGER ;
BEGIN
    IF dmsr.device_validator(dname,mfid,mdid,fid) THEN
    	INSERT INTO dmsr.devices (eid, devt, eby, dname, mfid, mdid, fid)
    	VALUES (eid, devt, eby, dname, mfid, mdid, fid)
		RETURNING did INTO d_id;
        RETURN QUERY SELECT rowid, 1, 'Insertion Successful',d_id;
	ELSE 
		RETURN QUERY SELECT rowid, 0, 'Validation Failed',0;
	END IF;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION dmsr.device_iterator(
	rowid INT[],
	mf_id INT[],
    d_names TEXT[],
	mdid INT[] ,
    fid INT[],
    event_bys INT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,did INTEGER) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(d_names, 1) LOOP
  
        RETURN QUERY SELECT * FROM dmsr.device_validator_writer(
			rowid[i],
			mf_id[i],
    		d_names[i],
			mdid[i] ,
   			fid[i],
    		event_bys[i],   
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;


SELECT * FROM dmsr.device_iterator(
	ARRAY[1,2],
	ARRAY[2,2],
    ARRAY['test111111111', 'test2'], 
    ARRAY[111,111], 
    ARRAY[1,1], 
    ARRAY[1, 1], 
    ARRAY[28, 28]
);

