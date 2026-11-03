CREATE OR REPLACE FUNCTION dmsr.firmware_validator(f_name VARCHAR,mf_id INTEGER) 
RETURNS BOOLEAN AS $$
BEGIN
   	IF EXISTS (SELECT 1 FROM dmsr.firmware WHERE fname = f_name ) THEN
        RETURN FALSE;
    END IF;
	
	IF NOT EXISTS (SELECT 1 FROM dmsr.mf WHERE mfid = mf_id AND isd = 'false') THEN
    	RETURN FALSE;
	END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION dmsr.firmware_validator_writer(
    rowid INTEGER,
	mfid INTEGER,
    fname VARCHAR,
    eby INTEGER,
    eid INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,f_id INTEGER) AS $$
DECLARE
    frevt dmsr.frevts := 'FIRMWARE_ONBOARDED';
	f_id INTEGER;
BEGIN
    IF dmsr.firmware_validator(fname,mfid) THEN
    	INSERT INTO dmsr.firmware (eid, frevt, eby, fname, mfid)
    	VALUES (eid, frevt, eby, fname, mfid)
		RETURNING fid INTO f_id;
		RETURN QUERY SELECT rowid, 1, 'Insertion Successful',f_id;		
	ELSE 
		RETURN QUERY SELECT rowid, 0, 'Validation Failed',0;
	END IF;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION dmsr.firmware_iterator(
	rowid INT[],
	mf_id INT[],
    f_names TEXT[],
    event_bys INT[],
    eids INT[]
) 
RETURNS TABLE (row_id INTEGER, status INTEGER, msg TEXT,fid INTEGER) AS
$$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(f_names, 1) LOOP
  
        RETURN QUERY SELECT * FROM dmsr.firmware_validator_writer(
			rowid[i],
			mf_id[i],
    		f_names[i],
    		event_bys[i],   
            eids[i]
        ); 
    END LOOP; 
END;
$$ LANGUAGE plpgsql;


SELECT * FROM dmsr.firmware_iterator(
	ARRAY[1,2],
	ARRAY[2,3],
    ARRAY['te111', 'tet2'],  
    ARRAY[1, 1], 
    ARRAY[28, 28]
);

