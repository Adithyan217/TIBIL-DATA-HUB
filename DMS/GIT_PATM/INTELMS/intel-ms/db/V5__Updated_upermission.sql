DROP FUNCTION IF EXISTS intel.add_user_permissions;


CREATE OR REPLACE FUNCTION intel.add_user_permissions(
    p_username VARCHAR,
    p_allow_banks VARCHAR[],
    p_deny_banks VARCHAR[],
    p_allow_branches VARCHAR[],
    p_deny_branches VARCHAR[],
    f_name VARCHAR,
    l_name VARCHAR,
	u_role VARCHAR,
	enabled BOOLEAN
)
RETURNS TABLE(
    r_username VARCHAR, 
    r_context intel.ucontexts, 
    r_context_id INT, 
    r_fname VARCHAR, 
    r_lname VARCHAR,
    r_action TEXT,  -- 'ALLOW' or 'DENY'
	r_urole VARCHAR
) AS $$
DECLARE
    bank_id INT;
    branch_id INT;
	all_arrays_empty BOOLEAN;

BEGIN
    IF NOT enable THEN
        UPDATE intel.upermissions
        SET isd = true
        WHERE username = p_username;

        RETURN QUERY
        SELECT p_username, NULL::intel.ucontexts, NULL::INT, NULL::VARCHAR, NULL::VARCHAR, 'DEACTIVATE', NULL::VARCHAR;
        RETURN;
    END IF;
    -- Check if all arrays are empty
    all_arrays_empty := 
        COALESCE(array_length(p_allow_banks, 1), 0) = 0 AND
        COALESCE(array_length(p_deny_banks, 1), 0) = 0 AND
        COALESCE(array_length(p_allow_branches, 1), 0) = 0 AND
        COALESCE(array_length(p_deny_branches, 1), 0) = 0;

    -- If all arrays are empty, update fname/lname globally and return UPDATE result
    IF all_arrays_empty THEN
	
        UPDATE intel.upermissions
        SET fname = f_name,
            lname = l_name
        WHERE username = p_username;
			    
		RETURN QUERY
        SELECT p_username, NULL::intel.ucontexts, NULL::INT, f_name, l_name, 'UPDATE',NULL::VARCHAR;
    END IF;
    -- Handle allowed banks
    FOR i IN 1..COALESCE(array_length(p_allow_banks, 1), 0) LOOP
        SELECT bid INTO bank_id FROM registry.banks WHERE bname = p_allow_banks[i];

        IF bank_id IS NOT NULL THEN
                RETURN QUERY
                INSERT INTO intel.upermissions AS u (username, context, context_id, fname, lname,urole)
                VALUES (p_username, 'BANK', bank_id, f_name, l_name,u_role)
				ON CONFLICT(username, context, context_id) 
			    DO UPDATE SET isd = FALSE
                RETURNING u.username, u.context, u.context_id, u.fname, u.lname, 'ALLOW'::TEXT,u.urole;
        ELSE
            RAISE NOTICE 'Bank "%" not found.', p_allow_banks[i];
        END IF;
    END LOOP;

    -- Handle denied banks
    FOR i IN 1..COALESCE(array_length(p_deny_banks, 1), 0) LOOP
        SELECT bid INTO bank_id FROM registry.banks WHERE bname = p_deny_banks[i];

        IF bank_id IS NOT NULL THEN
            RETURN QUERY
            UPDATE intel.upermissions AS u
            SET isd = true
            WHERE u.username = p_username AND u.context_id = bank_id AND u.context = 'BANK'
            RETURNING u.username, u.context, u.context_id, u.fname, u.lname, 'DENY'::TEXT,u.urole;
        ELSE
            RAISE NOTICE 'Bank "%" not found.', p_deny_banks[i];
        END IF;
    END LOOP;

    -- Handle allowed branches
    FOR i IN 1..COALESCE(array_length(p_allow_branches, 1), 0) LOOP
        SELECT brid INTO branch_id FROM registry.branches WHERE brname = p_allow_branches[i];

        IF branch_id IS NOT NULL THEN

                RETURN QUERY
                INSERT INTO intel.upermissions AS u (username, context, context_id, fname, lname,urole)
                VALUES (p_username, 'BRANCH', branch_id, f_name, l_name,u_role)
				ON CONFLICT(username, context, context_id) 
			    DO UPDATE SET isd = FALSE				
                RETURNING u.username, u.context, u.context_id, u.fname, u.lname, 'ALLOW'::TEXT,u.urole;
        ELSE
            RAISE NOTICE 'Branch "%" not found.', p_allow_branches[i];
        END IF;
    END LOOP;

    -- Handle denied branches
    FOR i IN 1..COALESCE(array_length(p_deny_branches, 1), 0) LOOP
        SELECT brid INTO branch_id FROM registry.branches WHERE brname = p_deny_branches[i];

        IF branch_id IS NOT NULL THEN
            RETURN QUERY
            UPDATE intel.upermissions AS u
            SET isd = true
            WHERE u.username = p_username AND u.context_id = branch_id AND u.context = 'BRANCH'
            RETURNING u.username, u.context, u.context_id, u.fname, u.lname, 'DENY'::TEXT,u.urole;
        ELSE
            RAISE NOTICE 'Branch "%" not found.', p_deny_branches[i];
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;


