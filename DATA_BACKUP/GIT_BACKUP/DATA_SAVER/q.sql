ALTER TABLE registry.devices 
ADD COLUMN ln INTEGER NOT NULL REFERENCES registry.mf_language(lid);

DROP FUNCTION IF EXISTS registry.update_device;

CREATE OR REPLACE FUNCTION registry.update_device(
    rowid INTEGER,
    d_id INTEGER,
    f_name VARCHAR,
    lang VARCHAR,
    sb_e BOOLEAN,
    e_by VARCHAR,
    e_id INTEGER
)
RETURNS TABLE (
    row_id INTEGER,
    status INTEGER,
    msg registry.devices_msgs[],
    d_names VARCHAR
) AS $$
DECLARE
    device_name VARCHAR;
    f_id INTEGER;
    validator_result registry.devices_msgs[];
	l_id INTEGER;
BEGIN
    validator_result := registry.update_device_validator(f_name,sb_e,lang,d_id);

    IF array_length(validator_result, 1) > 0 THEN
        RETURN QUERY SELECT rowid, 0, validator_result, NULL::VARCHAR;
        RETURN;
    END IF;

	IF f_name IS NOT NULL THEN
        SELECT fid INTO f_id
        FROM registry.firmware
        WHERE fname = f_name;
    END IF;

	IF lang IS NOT NULL THEN
        SELECT lid INTO l_id
        FROM registry.mf_language
        WHERE dlid = lang;
    END IF;
	

    UPDATE registry.devices
    SET 
        fid  = COALESCE(f_id, fid),
        sbe  = COALESCE(sb_e, sbe),
        ln   = COALESCE(l_id, ln),
        eby  = e_by,
        eid  = e_id,
        eat  = CURRENT_TIMESTAMP
    WHERE did = d_id
    RETURNING dname INTO device_name;

    RETURN QUERY SELECT rowid, 1, ARRAY['SUCCESS_UPDATE']::registry.devices_msgs[], device_name;
END;
$$ LANGUAGE plpgsql;


ALTER TYPE registry.devices_msgs ADD VALUE IF NOT EXISTS 'INVALID_LANGUAGE';

DROP FUNCTION IF EXISTS registry.update_device_validator;


CREATE OR REPLACE FUNCTION registry.update_device_validator(
f_name VARCHAR,
sb_e BOOLEAN,
lang VARCHAR,
d_id INTEGER
)
RETURNS registry.devices_msgs[] AS $$
DECLARE
messages registry.devices_msgs[];
BEGIN
    IF NOT EXISTS (SELECT 1 FROM registry.devices WHERE did = d_id and isd = false and isa = true) THEN
        messages := array_append(messages, 'INVALID_DEVICE'::registry.devices_msgs);
    END IF;

    IF f_name IS NULL AND sb_e IS NULL AND lang IS NULL THEN
        messages := array_append(messages, 'EMPTY_UPDATE'::registry.devices_msgs);
        RETURN messages;
    END IF;

    IF f_name IS NOT NULL AND NOT EXISTS (SELECT 1 FROM registry.firmware WHERE fname = f_name) THEN
        messages := array_append(messages, 'INVALID_FIRMWARE'::registry.devices_msgs);
    END IF;

	IF lang IS NOT NULL AND NOT EXISTS (SELECT 1 FROM registry.mf_language WHERE dlid = lang) THEN
        messages := array_append(messages, 'INVALID_LANGUAGE'::registry.devices_msgs);
    END IF;

    RETURN messages;
END;
$$ LANGUAGE plpgsql;


-- SELECT * FROM registry.update_device(
--     1,                 -- rowid
--     10,                -- d_id (device ID)
--     NULL::VARCHAR,     -- f_name (firmware name, nullable)
--     '1',                 -- lang (language ID as integer)
--     NULL::BOOLEAN,     -- sb_e (boolean, nullable)
--     'admin_user',      -- e_by (event by user)
--     501                -- e_id (event ID)
-- );


