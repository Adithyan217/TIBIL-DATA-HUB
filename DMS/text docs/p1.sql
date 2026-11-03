select sum(txnamt) FROM registry.plog
order by txnamt desc
limit 10

select * from registry.devices where imei = '862170069774899'

select sum(*) from drouter.payments_cache
where amount = 100000

select sum(amount) from drouter.payments_cache


select * FROM intel.payment_metrics('disha.bhat@tibilsolutions.com')


select * FROM registry.routes

select * from drouter.payments_cache where dname like '1115%'

select * from registry.plog where txnamt = 600000

select imei from drouter.soundboxes where rcontext = 'walnut_mqtt' AND imei != '867723070182950'



select * from registry.plog where imei = '867723070182950'

UPDATE registry.plog SET txnamt=txnamt/100 where imei = '867723070182950'

UPDATE registry.plog 
SET txnamt = ROUND(txnamt::numeric / 100, 2) 
WHERE imei IN (select imei from drouter.soundboxes where rcontext = 'walnut_mqtt' AND imei != '867723070182950'
)



select * from registry.devices where imei IN (select imei from drouter.soundboxes where rcontext = 'walnut_mqtt' AND imei != '867723070182950'
)

select sum(txnamt) FROM registry.plog WHERE imei NOT IN (select imei from drouter.soundboxes where rcontext = 'walnut_mqtt'
)







select sum(txnamt) FROM registry.plog WHERE imei in (select imei from drouter.soundboxes where rcontext = 'cwd_mqtt')


select sum(amount) FROM drouter.payments_cache WHERE dname in (select dname from drouter.soundboxes where rcontext = 'cwd_mqtt')

select sum(txnamt) FROM registry.plog WHERE imei  in (select imei from registry.devices)

select count(amount) FROM drouter.payments_cache WHERE dname  in (select dname from registry.devices)

select count(*) FROM drouter.soundboxes WHERE imei in (select imei from registry.devices)

select brid FROM registry.branches


select context_id FROM registry.upermissions where username = 'disha.bhat@tibilsolutions.com' AND context ='BRANCH' AND context_id not in (select brid FROM registry.branches
)

select brid,brname,eat from registry.branches where brid not in (select context_id FROM registry.upermissions where username = 'disha.bhat@tibilsolutions.com' AND context ='BRANCH')

select context_id,brid FROM registry.upermissions u
RIGHT JOIN registry.branches b ON b.brid = u.context_id
WHERE username = 'disha.bhat@tibilsolutions.com' AND context ='BRANCH'


SELECT intel.add_user_permissions(
    'disha.bhat@tibilsolutions.com',
    ARRAY[]::TEXT[],
    ARRAY['Asansol','Kolhapur','Khordha','Amruthahalli','BHAGALPUR']
);


select * from registry.branches where eat::date >= CURRENT_DATE - INTERVAL '14 days'

select * FROM registry.branches WHERE brname like 'BHAGALPUR%'

select * from registry.branches where brid in (271,274,275,276,273,272)


SELECT 'total_txn' AS mname, COUNT(txnamt)::DOUBLE PRECISION AS mvalue
    FROM registry.plog p
	JOIN registry.devices d ON p.imei = d.imei
	JOIN registry.sb s ON d.did = s.did
	WHERE s.bid IN (SELECT context_id FROM intel.upermissions  WHERE username = 'disha.bhat@tibilsolutions.com' AND context = 'BANK' )
	AND s.brid IN (SELECT context_id FROM intel.upermissions  WHERE username = 'disha.bhat@tibilsolutions.com' AND context = 'BRANCH' )
    UNION ALL
    SELECT 'total_amt', COALESCE(SUM(txnamt), 0)
        FROM registry.plog p
	JOIN registry.devices d ON p.imei = d.imei
	JOIN registry.sb s ON d.did = s.did
	WHERE s.bid IN (SELECT context_id FROM intel.upermissions  WHERE username = 'disha.bhat@tibilsolutions.com' AND context = 'BANK' )
	AND s.brid IN (SELECT context_id FROM intel.upermissions  WHERE username = 'disha.bhat@tibilsolutions.com' AND context = 'BRANCH' );


select sum(txnamt) FROM registry.plog WHERE imei  in (select imei from registry.devices WHERE did IN (select did from registry.sb where bid is NULL ))
