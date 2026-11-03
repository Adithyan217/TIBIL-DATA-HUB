select brid,brname,eat from registry.branches where brid not in (select context_id FROM registry.upermissions where username = 'ankush@pocketatm.in' AND context ='BRANCH')

select dname from registry.devices WHERE brname ILIKE 'Asans%'

select dname,imei from drouter.soundboxes

select distinct(s.dname) from drouter.soundboxes s
join registry.plog p on s.imei = p.imei
where p.imei not in (select imei from registry.devices)

select distinct(p.imei) from registry.plog p

SELECT * from intel.add_user_permissions(
    'ankush@pocketatm.in',
    ARRAY[]::TEXT[],
    ARRAY['BIHAR SHARIF','DELHI-SOUTH EXTENSION']
);


select dname , count(*) from 
SELECT * from workflow.add_user_permissions(
    'ankush@pocketatm.in',
    ARRAY['BRANCH','BRANCH']::workflow.ucontexts[],
    ARRAY[277,278]
);

select * from registry.upermissions where username like 'ankush%' AND context = 'BRANCH'
order by context_id


select d.dname
,sb.brid,sb.mid 
FROM registry.devices d
JOIN registry.sb sb ON sb.did = d.did
-- JOIN registry.merchants m ON m.mpid = sb.mid
WHERE dname IN ('100800','100806','100424','100729','100192','100463')
order by dname

UPDATE registry.sb SET brid = null WHERE did in (select did FROM registry.devices WHERE dname IN ('100192','100463'))


disha.bhat@tibilsolutions.com
sushil@pocketatm.in
ankush@pocketatm.in

select dname,count(*),imei from drouter.payments_cache 
where dname in (
    '100866', '100872', '100408', '100418', '100862', '100938', '100438', '100444', '100446', '100450',
    '100475', '100480', '100493', '100507', '100513', '100529', '100536', '100538', '100539', '100543',
    '100545', '100546', '100548', '100549', '100552', '100556', '100560', '100561', '100565', '100567',
    '100576', '100582', '100587', '100589', '100590', '100593', '100595', '100598', '100603', '100606',
    '100618', '100107', '100620', '100623', '100631', '100633', '100121', '100636', '100639', '100640',
    '100642', '100644', '100645', '100647', '100649', '100650', '100653', '100655', '100657', '100145',
    '100669', '100671', '100672', '100680', '100170', '100171', '100172', '100693', '100695', '100699',
    '100701', '100702', '100704', '100707', '100708', '100714', '100715', '100719', '100720', '100207',
    '100722', '100214', '100730', '100218', '100739', '100740', '100742', '100231', '100234', '100750',
    '100753', '100241', '100755', '100769', '100261', '100774', '100783', '100787', '100788', '100789',
    '100792', '100282', '100795', '100798', '100802', '100301', '100821', '100823', '100832', '100834',
    '100840', '100844', '100332', '100851', '100852', '100855', '100861', '100350'
)
AND EXTRACT(MONTH FROM created_at) IN (3, 4)  
group by dname ,imei
order by count 
