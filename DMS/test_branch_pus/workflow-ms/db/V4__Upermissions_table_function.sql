CREATE TYPE workflow.ucontexts AS ENUM(
'BANK',
'BRANCH',
'USER'
);


CREATE TABLE IF NOT EXISTS workflow.upermissions(
upid SERIAL PRIMARY KEY,
username VARCHAR,
context workflow.ucontexts,
context_id INTEGER
);

CREATE INDEX IF NOT EXISTS idx_upermission_username ON workflow.upermissions(username);
CREATE INDEX IF NOT EXISTS idx_upermission_context ON workflow.upermissions(context);


DROP FUNCTION IF EXISTS workflow.add_user_permissions;

CREATE OR REPLACE FUNCTION workflow.add_user_permissions(
    p_username TEXT,
    p_context workflow.ucontexts[],
    p_context_id INTEGER[]
)
RETURNS TABLE(username VARCHAR, context workflow.ucontexts, context_id INT) AS $$
BEGIN
    FOR i IN 1..array_length(p_context, 1) 
    LOOP
            RETURN QUERY
            INSERT INTO workflow.upermissions AS u(username, context, context_id)
            VALUES (p_username, p_context[i], p_context_id[i])
            RETURNING u.username, u.context, u.context_id;
    END LOOP;

END;
$$ LANGUAGE plpgsql;