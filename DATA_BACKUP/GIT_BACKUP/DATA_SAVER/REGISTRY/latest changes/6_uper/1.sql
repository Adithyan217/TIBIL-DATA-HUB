DROP FUNCTION IF EXISTS registry.add_user_permissions;


CREATE OR REPLACE FUNCTION registry.add_user_permissions(
    p_username TEXT,
    p_allow_banks TEXT[],
    p_deny_banks TEXT[],
    p_allow_branches TEXT[],
    p_deny_branches TEXT[],
    f_name TEXT,
    l_name TEXT,
	u_role TEXT
)
RETURNS TABLE(
    r_username VARCHAR, 
    r_context registry.ucontexts, 
    r_context_id INT, 
    r_fname VARCHAR, 
    r_lname VARCHAR,
    r_action TEXT,
	r_urole VARCHAR
) AS $$
DECLARE
    bank_id INT;
    branch_id INT;
BEGIN
    -- Handle allowed banks
    FOR i IN 1..COALESCE(array_length(p_allow_banks, 1), 0) LOOP
        SELECT bid INTO bank_id FROM registry.banks WHERE bname = p_allow_banks[i];

        IF bank_id IS NOT NULL THEN
			RETURN QUERY
				INSERT INTO registry.upermissions AS u (username, context, context_id, fname, lname,urole)
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
            UPDATE registry.upermissions AS u
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
			INSERT INTO registry.upermissions AS u (username, context, context_id, fname, lname,urole)
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
            UPDATE registry.upermissions AS u
            SET isd = true
            WHERE u.username = p_username AND u.context_id = branch_id AND u.context = 'BRANCH'
            RETURNING u.username, u.context, u.context_id, u.fname, u.lname, 'DENY'::TEXT,u.urole;
        ELSE
            RAISE NOTICE 'Branch "%" not found.', p_deny_branches[i];
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
