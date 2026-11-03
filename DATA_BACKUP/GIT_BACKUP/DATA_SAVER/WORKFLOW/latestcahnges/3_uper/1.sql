DROP FUNCTION IF EXISTS workflow.add_user_permissions;

CREATE OR REPLACE FUNCTION workflow.add_user_permissions(
    p_username TEXT,
    p_context workflow.ucontexts[], 
    p_context_id INTEGER[],
    p_action TEXT[],  -- 'ALLOW' or 'DENY'
    f_name TEXT,
    l_name TEXT,
    u_role TEXT
)
RETURNS TABLE(
    r_username VARCHAR, 
    r_context workflow.ucontexts, 
    r_context_id INTEGER,
    r_fname VARCHAR,
    r_lname VARCHAR,
    r_action TEXT,
    r_urole TEXT 
) AS $$
BEGIN
    FOR i IN 1..COALESCE(array_length(p_context, 1), 0) LOOP
        IF p_action[i] = 'ALLOW' THEN

            RETURN QUERY
            INSERT INTO workflow.upermissions AS u (username, context, context_id, fname, lname, urole)
            VALUES (p_username, p_context[i], p_context_id[i], f_name, l_name, u_role)
			ON CONFLICT(username, context, context_id) 
			DO UPDATE SET isd = FALSE
			RETURNING u.username, u.context, u.context_id, u.fname, u.lname, 'ALLOW'::TEXT, u.urole;

        ELSIF p_action[i] = 'DENY' THEN
            -- Set isd = true for deny
            RETURN QUERY
            UPDATE workflow.upermissions AS u
            SET isd = true
            WHERE u.username = p_username AND u.context = p_context[i] AND u.context_id = p_context_id[i]
            RETURNING u.username, u.context, u.context_id, u.fname, u.lname, 'DENY'::TEXT, u.urole;

        ELSE
            RAISE EXCEPTION 'Invalid action value at position %: % (expected ALLOW or DENY)', i, p_action[i];
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;