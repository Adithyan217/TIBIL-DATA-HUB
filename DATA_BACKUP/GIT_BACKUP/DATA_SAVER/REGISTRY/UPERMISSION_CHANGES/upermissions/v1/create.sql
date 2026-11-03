CREATE TYPE registry.ucontexts AS ENUM(
'BANK',
'BRANCH',
'USER'
);


CREATE TABLE registry.upermissions(
upid SERIAL PRIMARY KEY,
username VARCHAR,
context registry.ucontexts,
context_id INTEGER
);

CREATE INDEX idx_upermission_username ON registry.upermissions(username);
CREATE INDEX idx_upermission_context ON registry.upermissions(context);
