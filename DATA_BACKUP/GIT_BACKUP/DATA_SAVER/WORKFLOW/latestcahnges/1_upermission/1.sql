ALTER TABLE workflow.upermissions ADD COLUMN fname VARCHAR;
ALTER TABLE workflow.upermissions ADD COLUMN lname VARCHAR;


DROP FUNCTION IF EXISTS workflow.add_user_permissions

CREATE OR REPLACE FUNCTION workflow.add_user_permissions(
    p_username TEXT,
    p_context workflow.ucontexts[], 
    p_context_id INTEGER[],
	f_name TEXT,
	l_name TEXT
)
RETURNS TABLE(username VARCHAR, context workflow.ucontexts, context_id INTEGER) AS $$
BEGIN
    FOR i IN 1..array_length(p_context, 1) 
    LOOP
            RETURN QUERY
            INSERT INTO workflow.upermissions AS u(username, context, context_id,fname,lname)
            VALUES (p_username, p_context[i], p_context_id[i],f_name,l_name)
            RETURNING u.username, u.context, u.context_id;
    END LOOP;

END;

$$ LANGUAGE plpgsql;


SELECT * FROM workflow.add_user_permissions(
    'alice@example.com',
    ARRAY['BANK', 'BRANCH']::workflow.ucontexts[],
    ARRAY[1, 10],
    'Alice',
    'Smith'
);