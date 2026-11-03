CREATE TYPE intel.ucontexts AS ENUM(
'BANK',
'BRANCH',
'USER'
);


CREATE TABLE intel.upermissions(
upid SERIAL PRIMARY KEY,
username VARCHAR,
context intel.ucontexts,
context_id INTEGER
);

CREATE INDEX idx_upermission_username ON intel.upermissions(username);
CREATE INDEX idx_upermission_context ON intel.upermissions(context);