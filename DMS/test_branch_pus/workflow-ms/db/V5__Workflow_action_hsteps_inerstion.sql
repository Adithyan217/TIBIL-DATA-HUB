INSERT INTO workflow.wfactions(
	ecode, ainfo, htype,isvisible, category, vcode, ischainable)
	VALUES ('ONBOARD_BANK_RM','{"endpoint":"/requests/wfhandler"}','api',TRUE,'user_actions','Onboard Bank RM',FALSE),
    ('ONBOARD_BANK_ADMIN','{"endpoint":"/requests/wfhandler"}','api',TRUE,'user_actions','Onboard Bank Admin',FALSE),
    ('ONBOARD_CO_BANK_RM','{"endpoint":"/requests/wfhandler"}','api',TRUE,'user_actions','Onboard CO Bank RM',FALSE),
    ('ONBOARD_CO_BANK_ADMIN','{"endpoint":"/requests/wfhandler"}','api',TRUE,'user_actions','Onboard CO Bank Admin',FALSE);


INSERT INTO workflow.wfhsteps(
	 ecode, hinfo)
	VALUES ('ONBOARD_BANK_RM','[{"endpoint":"/user","sname":"Onboard Bank RM"}]'),
    ('ONBOARD_BANK_ADMIN','[{"endpoint":"/user","sname":"Onboard Bank Admin"}]'),
    ('ONBOARD_CO_BANK_RM','[{"endpoint":"/user","sname":"Onboard CO Bank RM"}]'),
    ('ONBOARD_CO_BANK_ADMIN','[{"endpoint":"/user","sname":"Onboard CO Bank Admin"}]');


