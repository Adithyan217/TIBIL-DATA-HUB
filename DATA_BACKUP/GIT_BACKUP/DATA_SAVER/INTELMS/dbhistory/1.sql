CREATE OR REPLACE FUNCTION intel.bank_metrics()
RETURNS TABLE (bank_cnt INTEGER, branch_cnt INTEGER, merchant_cnt INTEGER) AS $$
BEGIN
   
    SELECT COUNT(*) INTO bank_cnt FROM registry.banks WHERE isd = false AND isa = true;
    SELECT COUNT(*) INTO branch_cnt FROM registry.branches WHERE isd = false AND isa = true;
    SELECT COUNT(*) INTO merchant_cnt FROM registry.merchants WHERE isd = false AND isa = true;
    RETURN QUERY SELECT bank_cnt, branch_cnt, merchant_cnt;
END
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION intel.payment_metrics()
RETURNS TABLE (total_txn INTEGER, total_amt DOUBLE PRECISION) AS $$
BEGIN
   
    SELECT COUNT(*) INTO total_txn  FROM registry.plog;
    SELECT SUM(txnamt) INTO total_amt FROM registry.plog; 
    RETURN QUERY SELECT total_txn, total_amt;
END
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION intel.device_metrics()
RETURNS TABLE (total_device_cnt INTEGER, inventory_cnt INTEGER, allocated_cnt INTEGER) AS $$
BEGIN
   SELECT COUNT(did) INTO total_device_cnt FROM registry.devices where isd = false and isa = true; 
   SELECT count(sb.did) INTO inventory_cnt from registry.sb AS sb JOIN registry.devices as d ON sb.did = d.did WHERE d.isd = false and d.isa = true AND sb.mid IS  NULL
   AND sb.bid IS NULL AND sb.brid IS NULL;
   SELECT COUNT(sb.did) INTO allocated_cnt from registry.sb AS sb JOIN registry.devices as d ON sb.did = d.did WHERE d.isd = false and d.isa = true AND (sb.mid IS NOT NULL
   OR sb.bid IS NOT NULL OR sb.brid IS NOT NULL);
   RETURN QUERY SELECT total_device_cnt, inventory_cnt, allocated_cnt;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.device_request_metrics()
RETURNS TABLE (total INTEGER, open INTEGER, closed INTEGER) AS $$
BEGIN
	SELECT COUNT(drid) INTO total FROM registry.device_requests;
	SELECT COUNT(drid) INTO open FROM registry.device_requests WHERE status !='Delivered';
	SELECT COUNT(drid) INTO closed FROM registry.device_requests WHERE status = 'Delivered';
	RETURN QUERY SELECT total,open,closed;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION intel.device_issues_metrics()
RETURNS TABLE (total INTEGER, open INTEGER, closed INTEGER) AS $$
BEGIN
	SELECT COUNT(iid) INTO total FROM registry.device_issues;
	SELECT COUNT(iid) INTO open FROM registry.device_issues WHERE status ='Open';
	SELECT COUNT(iid) INTO closed FROM registry.device_issues WHERE status != 'Open';
	RETURN QUERY SELECT total,open,closed;
END
$$ LANGUAGE plpgsql;
