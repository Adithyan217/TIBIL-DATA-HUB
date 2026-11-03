SELECT * FROM registry.routes
 

SELECT count(pid) FROM drouter.payments_cache where status = 'SUCCESS_RESPONSE_FROM_MQTT' 
SELECT count(pid) FROM drouter.payments_cache where status = 'RECEIVED'

SELECT pid,status FROM drouter.payments_cache 

TRUNCATE TABLE drouter.payments_cache



EXPLAIN ANALYZE
SELECT * FROM registry.sbroutes 

DELETE FROM registry.sbroutes 

UPDATE  registry.sbroutes SET isd = false WHERE did !=1

CREATE TYPE IF NOT EXISTS drouter.pcstatus AS ENUM
    ('RECEIVED', 'TRANSFORMED', 'TRANSFORM_FAILED','DECRYPTED','ENCRYPTED', 'DECRYPTION_FAILED','ENCRYPTION_FAILED','TRANSFORMATION_FAILED','SENT_REQUEST_TO_SWITCH', 'SUCCESS_RESPONSE_FROM_SWITCH', 'FAILURE_RESPONSE_FROM_SWITCH', 'SENT_REQUEST_TO_MQTT', 'SUCCESS_RESPONSE_FROM_MQTT', 'FAILURE_RESPONSE_FROM_MQTT', 'RECEIVED_AND_FAILED');


EXPLAIN ANALYZE
SELECT dconfig,rid FROM registry.routes WHERE rid = (SELECT rid FROM registry.sbroutes WHERE did = 1)

SELECT COUNT(*) AS total_rows, 
       COUNT(*) FILTER (WHERE did = 30) AS matching_did,
       COUNT(*) FILTER (WHERE rid = 1) AS matching_rid
FROM registry.sbroutes;

ANALYZE registry.sbroutes;


SET enable_seqscan = OFF;
EXPLAIN ANALYZE SELECT * FROM registry.sbroutes WHERE did = 30 AND rid = 1;

