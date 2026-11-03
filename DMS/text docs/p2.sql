SELECT sum(p.txnamt),count(p.txnamt) from registry.plog p
JOIN registry.devices d ON p.imei=d.imei
JOIN registry.sb s ON s.did = d.did
WHERE s.bid=541 AND s.brid=394


SELECT * FROM intel.test_payment_metrics('tester@gmail.com','tester_bank','tester_branch','7DAYS')


SELECT * FROM intel.test_payment_metrics2('tester@gmail.com',99999,99999,'7DAYS')

CREATE OR REPLACE FUNCTION intel.test_payment_metrics2(
    uname VARCHAR,
    bank_id INT,
    branch_id INT,
    range_type VARCHAR
)
RETURNS TABLE (sum DOUBLE PRECISION, count BIGINT,cat date) AS $$
BEGIN
    RETURN QUERY
	SELECT sum(p.txnamt),count(p.txnamt),p.cat::date from registry.plog p
	JOIN registry.devices d ON p.imei=d.imei
	JOIN registry.sb s ON s.did = d.did
	WHERE s.bid=bank_id AND s.brid=branch_id
	 AND (
              range_type IS NULL OR
              (
                  (range_type = 'TODAY' AND p.cat::date = CURRENT_DATE)
                  OR (range_type = '7DAYS' AND p.cat::date >= CURRENT_DATE - INTERVAL '6 days')
                  OR (range_type = '30DAYS' AND p.cat::date >= CURRENT_DATE - INTERVAL '29 days')
              )
          )

	GROUP BY p.cat::date;

END
$$ LANGUAGE plpgsql;




select count(*) from registry.branches

select count(*) from registry.plog

select distinct(bid) from registry.sb

select bid,count(*) from registry.sb
group by bid




device - 25 per date
