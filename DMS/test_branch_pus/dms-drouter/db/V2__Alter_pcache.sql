ALTER TABLE drouter.payments_cache ADD COLUMN rtcount INT DEFAULT 0;
ALTER TYPE drouter.pcstatus ADD VALUE 'SIMULATE_RECEIVED';