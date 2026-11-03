CREATE TYPE  registry.ackStatus AS ENUM(
'RECEIVED_MSG_FROM_BROKER',
'RECEIVED_ACK_FROM_DEVICE'
);

CREATE TABLE IF NOT EXISTS registry.plog(
plid SERIAL PRIMARY KEY,
rrn VARCHAR NOT NULL UNIQUE,
imei VARCHAR NOT NULL,
txnAmt FLOAT,
cat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
status registry.ackstatus,
ack_status VARCHAR
);

CREATE INDEX IF NOT EXISTS idx_rrn ON registry.plog(rrn);
CREATE INDEX IF NOT EXISTS idx_imei ON registry.plog(imei);
CREATE INDEX iF NOT EXISTS idx_imei_cat ON registry.plog (imei, cat);