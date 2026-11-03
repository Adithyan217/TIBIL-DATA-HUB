ALTER TABLE registry.upermissions ADD COLUMN first_name VARCHAR;
ALTER TABLE registry.upermissions ADD COLUMN last_name VARCHAR;



select * from registry.upermissions

UPDATE registry.upermissions SET last_name = 'User' 



CREATE OR REPLACE FUNCTION registry.add_user_permissions(
    p_username TEXT,
    p_banks TEXT[],
    p_branches TEXT[],
	f_name TEXT ,
	l_name TEXT
)
RETURNS TABLE(username VARCHAR, context registry.ucontexts, context_id INT) AS $$
DECLARE
    bank_name TEXT;
    branch_name TEXT;
    bank_id INT;
    branch_id INT;
BEGIN
    -- Loop through each bank name provided
    FOR i IN 1..array_length(p_banks, 1) 
    LOOP
        -- Retrieve the bank ID
        SELECT bid INTO bank_id FROM registry.banks WHERE bname = p_banks[i];

        -- Ensure the bank exists
        IF bank_id IS NOT NULL THEN
            -- Insert the permission for the bank and return the inserted row
            RETURN QUERY
            INSERT INTO registry.upermissions AS u(username, context, context_id,first_name,last_name)
            VALUES (p_username, 'BANK', bank_id,f_name,l_name)
            RETURNING u.username, u.context, u.context_id;
        ELSE
            RAISE NOTICE 'Bank "%" not found.', p_banks[i];
        END IF;
    END LOOP;

    -- Loop through each branch name provided
    FOR i IN 1..array_length(p_branches, 1) 
    LOOP
        -- Retrieve the branch ID
        SELECT brid INTO branch_id FROM registry.branches WHERE brname = p_branches[i];

        -- Ensure the branch exists
        IF branch_id IS NOT NULL THEN
            -- Insert the permission for the branch and return the inserted row
            RETURN QUERY
            INSERT INTO registry.upermissions AS u(username, context, context_id,first_name,last_name)
            VALUES (p_username, 'BRANCH', branch_id,f_name,l_name)
            RETURNING u.username, u.context, u.context_id;
        ELSE
            RAISE NOTICE 'Branch "%" not found.', p_branches[i];
        END IF;
    END LOOP;

END;
$$ LANGUAGE plpgsql;


