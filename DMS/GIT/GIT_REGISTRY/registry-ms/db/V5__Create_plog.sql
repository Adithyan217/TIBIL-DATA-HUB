CREATE TYPE  registry.ackStatus AS ENUM(
'RECEIVED_MSG_FROM_BROKER',
'RECEIVED_ACK_FROM_DEVICE'
);

CREATE TABLE IF NOT EXISTS registry.plog(
plid SERIAL PRIMARY KEY,
rrn VARCHAR NOT NULL UNIQUE,
dname VARCHAR NOT NULL,
txnAmt FLOAT,
cat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
status registry.ackstatus
);

CREATE INDEX IF NOT EXISTS idx_rrn ON registry.plog(rrn);
CREATE INDEX IF NOT EXISTS idx_dname ON registry.plog(dname);
CREATE INDEX iF NOT EXISTS idx_dname_cat ON registry.plog (dname, cat);

