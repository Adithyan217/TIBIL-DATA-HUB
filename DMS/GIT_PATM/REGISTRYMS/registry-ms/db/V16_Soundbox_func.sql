CREATE TYPE registry.soundbox_msgs AS ENUM (
	'INVALID_DEVICE',
	'SUCCESS'
);

ALTER TYPE registry.devts ADD VALUE 'SOUNDBOX_ENABLED';


CREATE OR REPLACE FUNCTION registry.enable_soundbox_iterator(
 	rowids INTEGER[],
	device_ids INTEGER[],
	ebys VARCHAR[],
	eids INTEGER[]
  
)
RETURNS TABLE (row_id INTEGER,status INTEGER,msg registry.soundbox_msgs[])
AS $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(rowids, 1) LOOP
  
        RETURN QUERY SELECT * FROM registry.enable_soundbox_validator_writer(
			rowids[i],
			device_ids[i] ,
            ebys[i], 
            eids[i]
        ); 
    END LOOP; 
	
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION registry.enable_soundbox_validator_writer(
	rowid INTEGER,
	device_id INTEGER,
	event_by VARCHAR,
	event_id INTEGER
)
RETURNS TABLE (row_id INTEGER,status INTEGER,msg registry.soundbox_msgs[])
AS $$
DECLARE
    evt registry.devts := 'SOUNDBOX_ENABLED';
	validator_result registry.soundbox_msgs[];
BEGIN
	validator_result :=  registry.enable_soundbox_validator(device_id);

	IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result;
		RETURN;
	END IF;

	UPDATE registry.devices
	SET 
		sbe = true,
		devt = evt,
		eby = event_by,
		eid = event_id
	WHERE did = device_id;
	RETURN QUERY SELECT rowid,1,ARRAY['SUCCESS']::registry.soundbox_msgs[];
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION registry.enable_soundbox_validator(
device_id INTEGER)
RETURNS registry.soundbox_msgs[] AS $$
DECLARE 
	messages registry.soundbox_msgs[];
BEGIN
	IF NOT EXISTS (SELECT 1 FROM registry.devices WHERE did = device_id and isd = false and isa = true) THEN
		messages := array_append(messages, 'INVALID_DEVICE'::registry.soundbox_msgs);
  	END IF;
	RETURN messages;
END;
$$ LANGUAGE plpgsql;
