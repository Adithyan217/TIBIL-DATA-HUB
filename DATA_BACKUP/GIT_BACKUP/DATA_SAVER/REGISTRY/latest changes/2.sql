DROP FUNCTION IF EXISTS registry.add_user_permissions;

CREATE OR REPLACE FUNCTION registry.add_user_permissions(
    p_username TEXT,
    p_banks TEXT[],
    p_branches TEXT[]
)
RETURNS TABLE(username VARCHAR, context registry.ucontexts, context_id INT) AS $$
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
	            INSERT INTO registry.upermissions AS u(username, context, context_id)
	            VALUES (p_username, 'BANK', bank_id)
	            RETURNING u.username, u.context, u.context_id;
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
	            INSERT INTO registry.upermissions AS u(username, context, context_id)
	            VALUES (p_username, 'BRANCH', branch_id)
	            RETURNING u.username, u.context, u.context_id;
	        ELSE
	            RAISE NOTICE 'Branch "%" not found.', p_branches[i];
	        END IF;
		 END IF;
	    END LOOP;
END;
$$ LANGUAGE plpgsql;


CREATE INDEX IF NOT EXISTS idx_upermissions_username_contex_context_id
ON registry.upermissions(username,context,context_id);


ALTER TABLE registry.upermissions
ADD CONSTRAINT upermissions_unique UNIQUE (username, context, context_id);


select * from registry.upermissions where username = 'smp@gmail.com' order by username