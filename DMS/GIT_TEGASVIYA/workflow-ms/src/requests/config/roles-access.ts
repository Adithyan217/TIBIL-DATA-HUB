import { get } from "http";

export const rolesAccess = {
    "DMS Admin": {
          getEvtsCount:`SELECT  COUNT(el.eid)
                 FROM workflow.wfevtslog AS el
                 INNER JOIN workflow.wfalog AS al ON el.eid = al.eid
                 LEFT JOIN workflow.wfactions AS ac ON ac.aid = al.aid
                 WHERE TRUE `,
          getEvts:`SELECT el.eid, 
                   al.aid, 
                   el.ecode, 
                   el.eby,
                   al.wfstart AS started_at, 
                   ac.ischainable,
                   (select distinct(fname) FROM registry.upermissions where username= el.eby) AS fname,
				   (select distinct(lname) FROM registry.upermissions where username= el.eby) AS lname,
                   al.astatus AS action_status
            FROM workflow.wfevtslog AS el
            INNER JOIN workflow.wfalog AS al ON el.eid = al.eid
            LEFT JOIN workflow.wfactions AS ac ON ac.aid = al.aid
            WHERE isvisible = true `,
          getActionTypes:`SELECT vcode FROM workflow.wfactions WHERE isvisible = TRUE AND isd = FALSE ORDER BY category`
        },
    "Bank Admin":{
        getEvtsCount:`SELECT  COUNT(el.eid)
        FROM workflow.wfevtslog AS el
        INNER JOIN workflow.wfalog AS al ON el.eid = al.eid
        LEFT JOIN workflow.wfactions AS ac ON ac.aid = al.aid
                WHERE (
                        (
                            ac.vcode = ANY($1)
                            AND (el.einfo->'edetails'->0->>'bank_id') ~ '^\d+$'
                            AND (el.einfo->'edetails'->0->>'bank_id')::int IN (
                            SELECT context_id
                            FROM workflow.upermissions
                            WHERE username = $2
                                AND context = 'BANK'
                                AND isd = FALSE
                            )
                        )
                        OR el.eby = $3
                        ) `,
        getEvts:`	SELECT el.eid, 
        al.aid, 
        el.ecode, 
        el.eby,
        al.wfstart AS started_at, 
        ac.ischainable,
        (select distinct(fname) FROM registry.upermissions where username= el.eby) AS fname,
		(select distinct(lname) FROM registry.upermissions where username= el.eby) AS lname,
        al.astatus AS action_status
                FROM workflow.wfevtslog AS el
                INNER JOIN workflow.wfalog AS al ON el.eid = al.eid
                LEFT JOIN workflow.wfactions AS ac ON ac.aid = al.aid
                WHERE isvisible = true AND(
                        (
                            ac.vcode = ANY($1)
                            AND (el.einfo->'edetails'->0->>'bank_id') ~ '^\d+$'
                            AND (el.einfo->'edetails'->0->>'bank_id')::int IN (
                            SELECT context_id
                            FROM workflow.upermissions
                            WHERE username = $2
                                AND context = 'BANK'
                                AND isd = FALSE
                            )
                        )
                        OR el.eby = $3
                        ) 
`,
        getActionTypes:`SELECT vcode FROM workflow.wfactions WHERE isvisible = TRUE AND isd = FALSE AND ecode = ANY ($1) ORDER BY category`
},
        
    "Bank RM":{
        getEvtsCount:`SELECT  COUNT(el.eid)
                 FROM workflow.wfevtslog AS el
                 INNER JOIN workflow.wfalog AS al ON el.eid = al.eid
                 LEFT JOIN workflow.wfactions AS ac ON ac.aid = al.aid
                 WHERE el.eby = $1`,
          getEvts:`SELECT el.eid, 
       al.aid, 
       el.ecode, 
       el.eby,
       al.wfstart AS started_at, 
       ac.ischainable,
       (select distinct(fname) FROM registry.upermissions where username= el.eby) AS fname,
	   (select distinct(lname) FROM registry.upermissions where username= el.eby) AS lname,
       al.astatus AS action_status 
                 FROM workflow.wfevtslog AS el
                 INNER JOIN workflow.wfalog AS al ON el.eid = al.eid
                 LEFT JOIN workflow.wfactions AS ac ON ac.aid = al.aid
				 WHERE isvisible = true AND el.eby = $1 `,
            getActionTypes:`SELECT vcode FROM workflow.wfactions WHERE isvisible = TRUE AND isd = FALSE AND  ecode = ANY ($1) ORDER BY category`
        },
        "CO Bank Admin":{
            getEvtsCount:`SELECT  COUNT(el.eid)
            FROM workflow.wfevtslog AS el
            INNER JOIN workflow.wfalog AS al ON el.eid = al.eid
            LEFT JOIN workflow.wfactions AS ac ON ac.aid = al.aid
                    WHERE isvisible = true AND(
                            (
                                ac.vcode = ANY($1)
                                AND (el.einfo->'edetails'->0->>'bank_id') ~ '^\d+$'
                                AND (el.einfo->'edetails'->0->>'bank_id')::int IN (
                                SELECT context_id
                                FROM workflow.upermissions
                                WHERE username = $2
                                    AND context = 'BANK'
                                    AND isd = FALSE
                                )
                            )
                            OR el.eby = $3
                            ) `,
            getEvts:`	SELECT el.eid, 
            al.aid, 
            el.ecode, 
            el.eby,
            al.wfstart AS started_at, 
            ac.ischainable,
            (select distinct(fname) FROM registry.upermissions where username= el.eby) AS fname,
			(select distinct(lname) FROM registry.upermissions where username= el.eby) AS lname,
            al.astatus AS action_status
                    FROM workflow.wfevtslog AS el
                    INNER JOIN workflow.wfalog AS al ON el.eid = al.eid
                    LEFT JOIN workflow.wfactions AS ac ON ac.aid = al.aid
                    WHERE isvisible = true AND(
                            (
                                ac.vcode = ANY($1)
                                AND (el.einfo->'edetails'->0->>'bank_id') ~ '^\d+$'
                                AND (el.einfo->'edetails'->0->>'bank_id')::int IN (
                                SELECT context_id
                                FROM workflow.upermissions
                                WHERE username = $2
                                    AND context = 'BANK'
                                    AND isd = FALSE
                                )
                            )
                            OR el.eby = $3
                            ) 
    `,
            getActionTypes:`SELECT vcode FROM workflow.wfactions WHERE isvisible = TRUE AND isd = FALSE AND ecode = ANY ($1) ORDER BY category`
    },
            
        "CO Bank RM":{
            getEvtsCount:`SELECT  COUNT(el.eid)
                     FROM workflow.wfevtslog AS el
                     INNER JOIN workflow.wfalog AS al ON el.eid = al.eid
                     LEFT JOIN workflow.wfactions AS ac ON ac.aid = al.aid
                     WHERE el.eby = $1`,
              getEvts:`SELECT el.eid, 
           al.aid, 
           el.ecode, 
           el.eby,
           al.wfstart AS started_at, 
           ac.ischainable,
           (select distinct(fname) FROM registry.upermissions where username= el.eby) AS fname,
			(select distinct(lname) FROM registry.upermissions where username= el.eby) AS lname,
           al.astatus AS action_status 
                     FROM workflow.wfevtslog AS el
                     INNER JOIN workflow.wfalog AS al ON el.eid = al.eid
                     LEFT JOIN workflow.wfactions AS ac ON ac.aid = al.aid
                     WHERE isvisible = true AND el.eby = $1`,
                getActionTypes:`SELECT vcode FROM workflow.wfactions WHERE isvisible = TRUE AND isd = FALSE AND  ecode = ANY ($1) ORDER BY category`
            }
        
       
    }







            