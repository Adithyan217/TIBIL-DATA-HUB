ALTER TABLE registry.upermissions ADD COLUMN fname VARCHAR;
ALTER TABLE registry.upermissions ADD COLUMN lname VARCHAR;
ALTER TABLE registry.upermissions ADD COLUMN urole VARCHAR;


DROP FUNCTION IF EXISTS registry.add_user_permissions;

CREATE OR REPLACE FUNCTION registry.add_user_permissions(
    p_username TEXT,
    p_banks TEXT[],
    p_branches TEXT[],
	f_name TEXT,
	l_name TEXT,
	u_role TEXT
)
RETURNS TABLE(username VARCHAR, context registry.ucontexts, context_id INT,fname VARCHAR,lname VARCHAR) AS $$
DECLARE
    bank_name TEXT;
    branch_name TEXT;
    bank_id INT;
    branch_id INT;
BEGIN
    -- Loop through each bank name provided

    FOR i IN 1..COALESCE(array_length(p_banks, 1), 0) 
    LOOP
        SELECT bid INTO bank_id FROM registry.banks WHERE bname = p_banks[i];
		
		IF EXISTS (SELECT 1 FROM registry.upermissions AS u WHERE u.username=p_username AND u.context_id=bank_id AND u.context='BANK') THEN
			CONTINUE;
		ELSE	
			IF bank_id IS NOT NULL THEN
	            RETURN QUERY
	            INSERT INTO registry.upermissions AS u(username, context, context_id,fname,lname,urole)
	            VALUES (p_username, 'BANK', bank_id,f_name,l_name,u_role)
	            RETURNING u.username, u.context, u.context_id,u.fname,u.lname;
	        ELSE
	            RAISE NOTICE 'Bank "%" not found.', p_banks[i];
	        END IF;
		END IF;
    END LOOP;

    -- Loop through each branch name provided
		FOR i IN 1..COALESCE(array_length(p_branches, 1), 0) 
	    LOOP
	      SELECT brid INTO branch_id FROM registry.branches WHERE brname = p_branches[i];
		  
		  IF EXISTS (SELECT 1 FROM registry.upermissions AS u WHERE u.username=p_username AND u.context_id=branch_id AND u.context='BRANCH') THEN
				CONTINUE;
		  ELSE	
	        IF branch_id IS NOT NULL THEN
	            RETURN QUERY
	            INSERT INTO registry.upermissions AS u(username, context, context_id,fname,lname,urole)
	            VALUES (p_username, 'BRANCH', branch_id,f_name,l_name,u_role)
	            RETURNING u.username, u.context, u.context_id,u.fname,u.lname;
	        ELSE
	            RAISE NOTICE 'Branch "%" not found.', p_branches[i];
	        END IF;
		 END IF;
	    END LOOP;
END;
$$ LANGUAGE plpgsql;


CREATE INDEX IF NOT EXISTS idx_upermissions_username_contex_context_id
ON registry.upermissions(username,context,context_id);




SELECT * FROM registry.add_user_permissions(
    'john_doe2',                          -- p_username
    ARRAY['bank_1'],           -- p_banks
    ARRAY['branch_3', 'branch_2'],       -- p_branches
    'John',                              -- f_name
    'Doe'                                -- l_name
);

