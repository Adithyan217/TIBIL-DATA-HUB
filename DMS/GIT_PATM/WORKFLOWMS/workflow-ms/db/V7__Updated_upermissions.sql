ALTER TABLE workflow.upermissions ADD COLUMN urole VARCHAR;

DROP FUNCTION IF EXISTS workflow.add_user_permissions;

CREATE OR REPLACE FUNCTION workflow.add_user_permissions(
    p_username VARCHAR,
    p_context workflow.ucontexts[], 
    p_context_id INTEGER[],
    p_action VARCHAR[],  
    f_name VARCHAR,
    l_name VARCHAR,
    u_role VARCHAR
)
RETURNS TABLE(
    r_username VARCHAR, 
    r_context workflow.ucontexts, 
    r_context_id INTEGER,
    r_fname VARCHAR,
    r_lname VARCHAR,
    r_action TEXT,
    r_urole VARCHAR
) AS $$
BEGIN
    FOR i IN 1..COALESCE(array_length(p_action, 1), 0) LOOP
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

		ELSIF p_action[i] = 'UPDATE' THEN
			
			UPDATE workflow.upermissions AS u
			SET fname = f_name,
				lname = l_name
			WHERE u.username = p_username ;
			
			RETURN QUERY
			SELECT p_username,null::workflow.ucontexts,null::INT,f_name,l_name,'UPDATE',null::VARCHAR;

		ELSIF  p_action[i] = 'DEACTIVATE' THEN
			UPDATE workflow.upermissions
	        SET isd = true
	        WHERE username = p_username;
	
	        RETURN QUERY
	        SELECT p_username, NULL::workflow.ucontexts, NULL::INT, NULL::VARCHAR, NULL::VARCHAR, 'DEACTIVATE', NULL::VARCHAR,TRUE;
        ELSE
            RAISE EXCEPTION 'Invalid action value at position %: % (expected ALLOW ,DENY or UPDATE)', i, p_action[i];
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
