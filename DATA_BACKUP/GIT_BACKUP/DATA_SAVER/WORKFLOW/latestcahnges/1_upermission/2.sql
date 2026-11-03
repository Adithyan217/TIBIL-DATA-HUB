ALTER TABLE workflow.upermissions ADD COLUMN isd BOOLEAN DEFAULT false;


DROP FUNCTION IF EXISTS workflow.add_user_permissions;

CREATE OR REPLACE FUNCTION workflow.add_user_permissions(
    p_username TEXT,
    p_context workflow.ucontexts[], 
    p_context_id INTEGER[],
    p_action TEXT[],  -- 'ALLOW' or 'DENY'
    f_name TEXT,
    l_name TEXT
)
RETURNS TABLE(
    r_username VARCHAR, 
    r_context workflow.ucontexts, 
    r_context_id INTEGER,
    r_fname VARCHAR,
    r_lname VARCHAR,
    r_action TEXT
) AS $$
BEGIN
    FOR i IN 1..COALESCE(array_length(p_context, 1), 0) LOOP
        IF p_action[i] = 'ALLOW' THEN
            -- Insert only if not already present
            -- IF NOT EXISTS (
            --     SELECT 1 FROM workflow.upermissions AS u
            --     WHERE u.username = p_username AND u.context = p_context[i] AND u.context_id = p_context_id[i]
            -- ) THEN
                RETURN QUERY
                INSERT INTO workflow.upermissions AS u (username, context, context_id, fname, lname)
                VALUES (p_username, p_context[i], p_context_id[i], f_name, l_name)
			ON CONFLICT(username, context, context_id) 
			DO UPDATE SET isd = FALSE
			RETURNING u.username, u.context, u.context_id, u.fname, u.lname, 'ALLOW'::TEXT;
            -- END IF;

        ELSIF p_action[i] = 'DENY' THEN
            -- Set isd = true for deny
            RETURN QUERY
            UPDATE workflow.upermissions AS u
            SET isd = true
            WHERE u.username = p_username AND u.context = p_context[i] AND u.context_id = p_context_id[i]
            RETURNING u.username, u.context, u.context_id, u.fname, u.lname, 'DENY'::TEXT;

        ELSE
            RAISE EXCEPTION 'Invalid action value at position %: % (expected ALLOW or DENY)', i, p_action[i];
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE workflow.upermissions
ADD CONSTRAINT upermissions_unique_user_context
UNIQUE (username, context, context_id);

select * from workflow.upermissions WHERE username = 'john_doe'



SELECT * FROM workflow.add_user_permissions(
    'john_doe',  -- p_username
    ARRAY['BANK','BANK', 'BRANCH']::workflow.ucontexts[],  -- p_context
    ARRAY[1, 2,1],  -- p_context_id
    ARRAY['DENY', 'ALLOW','DENY'],  -- p_action
    'john_doe',  -- f_name
    'Smith'   -- l_name
);
