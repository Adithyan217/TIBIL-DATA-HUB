ALTER TABLE registry.upermissions ADD COLUMN fname VARCHAR;
ALTER TABLE registry.upermissions ADD COLUMN lname VARCHAR;
ALTER TABLE registry.upermissions ADD COLUMN urole VARCHAR;
ALTER TABLE registry.upermissions ADD COLUMN isd BOOLEAN DEFAULT false;


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
    r_action TEXT  -- 'ALLOW' or 'DENY'
) AS $$
DECLARE
    bank_id INT;
    branch_id INT;
BEGIN
    -- Handle allowed banks
    FOR i IN 1..COALESCE(array_length(p_allow_banks, 1), 0) LOOP
        SELECT bid INTO bank_id FROM registry.banks WHERE bname = p_allow_banks[i];

        IF bank_id IS NOT NULL THEN
            -- IF NOT EXISTS (
            --     SELECT 1 FROM registry.upermissions as u
            --     WHERE u.username = p_username AND u.context_id = bank_id AND u.context = 'BANK' AND isd = ''
            -- ) THEN
            --     RETURN QUERY
            --     INSERT INTO registry.upermissions AS u (username, context, context_id, fname, lname,urole)
            --     VALUES (p_username, 'BANK', bank_id, f_name, l_name,u_role)
            --     RETURNING u.username, u.context, u.context_id, u.fname, u.lname, 'ALLOW'::TEXT;
            -- END IF;
			RETURN QUERY
				INSERT INTO registry.upermissions AS u (username, context, context_id, fname, lname,urole)
                VALUES (p_username, 'BANK', bank_id, f_name, l_name,u_role)
				ON CONFLICT(username, context, context_id) 
				DO UPDATE SET isd = FALSE
                RETURNING u.username, u.context, u.context_id, u.fname, u.lname, 'ALLOW'::TEXT;
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
            RETURNING u.username, u.context, u.context_id, u.fname, u.lname, 'DENY'::TEXT;
        ELSE
            RAISE NOTICE 'Bank "%" not found.', p_deny_banks[i];
        END IF;
    END LOOP;

    -- Handle allowed branches
    FOR i IN 1..COALESCE(array_length(p_allow_branches, 1), 0) LOOP
        SELECT brid INTO branch_id FROM registry.branches WHERE brname = p_allow_branches[i];

        IF branch_id IS NOT NULL THEN
            -- IF NOT EXISTS (
            --     SELECT 1 FROM registry.upermissions AS u 
            --     WHERE u.username = p_username AND u.context_id = branch_id AND u.context = 'BRANCH'
            -- ) THEN
            --     RETURN QUERY
            --     INSERT INTO registry.upermissions AS u (username, context, context_id, fname, lname,urole)
            --     VALUES (p_username, 'BRANCH', branch_id, f_name, l_name,u_role)
            --     RETURNING u.username, u.context, u.context_id, u.fname, u.lname, 'ALLOW'::TEXT;
            -- END IF;\
			RETURN QUERY
			INSERT INTO registry.upermissions AS u (username, context, context_id, fname, lname,urole)
            VALUES (p_username, 'BRANCH', bank_id, f_name, l_name,u_role)
			ON CONFLICT(username, context, context_id) 
			DO UPDATE SET isd = FALSE
            RETURNING u.username, u.context, u.context_id, u.fname, u.lname, 'ALLOW'::TEXT;
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
            RETURNING u.username, u.context, u.context_id, u.fname, u.lname, 'DENY'::TEXT;
        ELSE
            RAISE NOTICE 'Branch "%" not found.', p_deny_branches[i];
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE registry.upermissions
ADD CONSTRAINT upermissions_unique_user_context
UNIQUE (username, context, context_id);

select * from registry.upermissions WHERE username = 'john_doe'


SELECT * FROM registry.add_user_permissions(
    'john_doe',  -- p_username
    ARRAY['bank_5']::TEXT[],  -- p_allow_banks
    ARRAY[]::TEXT[],            -- p_deny_banks
    ARRAY[]::TEXT[],  -- p_allow_branches
    ARRAY['branch_2']::TEXT[],              -- p_deny_branches
    'John',  -- f_name
    'Doe',    -- l_name
	'DMS Admin'
);
