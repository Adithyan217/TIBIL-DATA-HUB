

select * from registry.upermissions where username ='disha.bhat@tibilsolutions.com' AND context ='BRANCH' ORDER BY context_id
select * from registry.upermissions where username like 'ankush@pocketatm.in%' and context_id = 282




--------DIRECT SEARCH
select * from registry.banks where bname = 'bank_name'
select * from registry.branches where brname = 'branch_name'


------------------LIKE SEARCH
select * from registry.banks where bname ILIKE '%ba%'
select * from registry.branches where brname ILIKE '%bhadrak%'

-----------------FETCHING A USERS ALL PERMISSIONS

SELECT * from intel.upermissions where username like '%username%'

--------------------------------DISHA

SELECT * from registry.add_user_permissions(
	'disha.bhat@tibilsolutions.com',
	ARRAY[]::TEXT[],
	ARRAY[]::TEXT[],
	ARRAY['bhadrak']::TEXT[],
	ARRAY[]::TEXT[],
	'Disha',
	'Bhat',
	'DMS Admin'
)


SELECT workflow.add_user_permissions(
	'disha.bhat@tibilsolutions.com',
	ARRAY['BRANCH']::workflow.ucontexts[],
	ARRAY[285]::INT[],
	ARRAY['ALLOW']::TEXT[],
	'Disha',
	'Bhat'
)



------------------------------------ROHIT 
SELECT * from registry.add_user_permissions(
	'ankush@pocketatm.in',
	ARRAY[]::TEXT[],             ----------- allow bank access
	ARRAY[]::TEXT[],                 ----------- deny bank access
	ARRAY[]::TEXT[],                  ----------- allow branch access
	ARRAY[]::TEXT[],                 ------------ deny branch access
	'Ankush',
	'Kanojia',
	'DMS Admin'
)

SELECT * from intel.add_user_permissions(
	'ankush@pocketatm.in',
	ARRAY[]::TEXT[],      ----------- allow bank access
	ARRAY[]::TEXT[],                 ----------- deny bank access
	ARRAY[]::TEXT[],                  ----------- allow branch access
	ARRAY[]::TEXT[],                 ------------ deny branch access
	'Ankush',
	'Kanojia',
	'DMS Admin'
)


SELECT workflow.add_user_permissions(
	'ankush@pocketatm.in',
	ARRAY['BANK']::workflow.ucontexts[],    ----------- BANK or BRANCH
	ARRAY[]::INT[],                 -------------- bank or branch internal id
	ARRAY['ALLOW']::TEXT[],          ------------ ALLOW or DENY
	'Ankush',
	'Kanojia'
)
