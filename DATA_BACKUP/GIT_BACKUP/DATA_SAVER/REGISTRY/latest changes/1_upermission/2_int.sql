DROP FUNCTION IF EXISTS registry.add_user_permissions;

CREATE OR REPLACE FUNCTION registry.add_user_permissions(
    p_username TEXT,
    p_banks INT[],
    p_branches INT[],
	f_name TEXT,
	l_name TEXT
)
RETURNS TABLE(username VARCHAR, context registry.ucontexts, context_id INT,fname VARCHAR,lname VARCHAR) AS $$
DECLARE

BEGIN
    -- Loop through each bank name provided

    FOR i IN 1..COALESCE(array_length(p_banks, 1), 0) 
    LOOP
		
		IF EXISTS (SELECT 1 FROM registry.upermissions AS u WHERE u.username=p_username AND u.context_id=p_banks[i] AND u.context='BANK') THEN
			CONTINUE;
		ELSE	
			IF p_banks[i] IS NOT NULL THEN
	            RETURN QUERY
	            INSERT INTO registry.upermissions AS u(username, context, context_id,fname,lname)
	            VALUES (p_username, 'BANK', p_banks[i],f_name,l_name)
	            RETURNING u.username, u.context, u.context_id,u.fname,u.lname;
	        ELSE
	            RAISE NOTICE 'Bank "%" not found.', p_banks[i];
	        END IF;
		END IF;
    END LOOP;

    -- Loop through each branch name provided
		FOR i IN 1..COALESCE(array_length(p_branches, 1), 0) 
	    LOOP
		  
		  IF EXISTS (SELECT 1 FROM registry.upermissions AS u WHERE u.username=p_username AND u.context_id=p_branches[i] AND u.context='BRANCH') THEN
				CONTINUE;
		  ELSE	
	        IF p_branches[i] IS NOT NULL THEN
	            RETURN QUERY
	            INSERT INTO registry.upermissions AS u(username, context, context_id,fname,lname)
	            VALUES (p_username, 'BRANCH', p_branches[i],f_name,l_name)
	            RETURNING u.username, u.context, u.context_id,u.fname,u.lname;
	        ELSE
	            RAISE NOTICE 'Branch "%" not found.', p_branches[i];
	        END IF;
		 END IF;
	    END LOOP;
END;
$$ LANGUAGE plpgsql;