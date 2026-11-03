-- DROP TABLE IF EXISTS drouter.payments_cache;
-- DROP SCHEMA IF EXISTS drouter;
-- DROP TABLE IF EXISTS drouter.dlogs;
-- DROP TABLE IF EXISTS drouter.mqtt_cache;

CREATE SCHEMA IF NOT EXISTS drouter;

CREATE TYPE IF NOT EXISTS drouter.pcstatus AS ENUM
    ('RECEIVED', 'TRANSFORMED', 'TRANSFORM_FAILED','DECRYPTED','ENCRYPTED', 'DECRYPTION_FAILED','ENCRYPTION_FAILED','TRANSFORMATION_FAILED','SENT_REQUEST_TO_SWITCH', 'SUCCESS_RESPONSE_FROM_SWITCH', 'FAILURE_RESPONSE_FROM_SWITCH', 'SENT_REQUEST_TO_MQTT', 'SUCCESS_RESPONSE_FROM_MQTT', 'FAILURE_RESPONSE_FROM_MQTT', 'RECEIVED_AND_FAILED');


CREATE TABLE IF NOT EXISTS drouter.payments_cache (
  pid SERIAL PRIMARY KEY,
  iid INTEGER NOT NULL,
  did INTEGER NOT NULL,
  amount DOUBLE,
  transaction_time BIGINT,
  status switch.pcstatus NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);

CREATE INDEX IF NOT EXISTS idx_payments_cache_iid
ON drouter.payments_cache(iid);

CREATE INDEX IF NOT EXISTS idx_payments_cache_did
ON drouter.payments_cache(did);

CREATE INDEX IF NOT EXISTS idx_payments_cache_status
ON drouter.payments_cache(status);

CREATE INDEX IF NOT EXISTS idx_payments_cache_iid_did
ON drouter.payments_cache(iid, did);

CREATE INDEX IF NOT EXISTS idx_payments_cache_iid_did_status
ON drouter.payments_cache(iid, did, status);

CREATE TABLE IF NOT EXISTS drouter.dlogs(
    lid serial PRIMARY KEY,
    rid VARCHAR,
    did VARCHAR,
    response json,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
);

CREATE INDEX IF NOT EXISTS idx_dlogs_rid
ON drouter.dlogs(rid);

CREATE INDEX IF NOT EXISTS idx_dlogs_did
ON drouter.dlogs(did);

CREATE INDEX IF NOT EXISTS idx_dlogs_rid_did
ON drouter.dlogs(rid, did);



CREATE TABLE IF NOT EXISTS drouter.mqtt_cache (
    pid SERIAL PRIMARY KEY,
    did VARCHAR,
    details JSON,
    status drouter.pcstatus NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rid VARCHAR
);

CREATE INDEX IF NOT EXISTS idx_mqtt_cache_did
ON drouter.mqtt_cache(did);

CREATE INDEX IF NOT EXISTS idx_mqtt_cache_status
ON drouter.mqtt_cache(status);

CREATE INDEX IF NOT EXISTS idx_mqtt_cache_rid
ON drouter.mqtt_cache(rid);

CREATE INDEX IF NOT EXISTS idx_mqtt_cache_did_rid
ON drouter.mqtt_cache(did, rid);

CREATE INDEX IF NOT EXISTS idx_mqtt_cache_did_rid_status
ON drouter.mqtt_cache(did, rid, status);

