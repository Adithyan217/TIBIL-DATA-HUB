ALTER TABLE workflow.wfhlog ADD COLUMN sname VARCHAR;

INSERT INTO workflow.wfactions (ecode, ainfo, htype, isd, category, isvisible,vcode) VALUES
('ENABLE_SOUNDBOX', '{"endpoint":"/requests/wfhandler"}', 'api', false, 'device_actions', true,'Enable Soundbox');


INSERT INTO workflow.wfhsteps (ecode, hinfo)
VALUES
    ('ENABLE_SOUNDBOX', '[{"endpoint":"/registry/devices","sname":"Update Device"},{"endpoint":"/drouter/sb","sname":"Enable Soundbox"}]');





INSERT INTO workflow.wfactions(ecode, ainfo, htype, category, isvisible, isd, vcode, ischainable)
VALUES('DEVICE_ISSUE_RESOLVED','{"endpoint":"/requests/wfhandler"}', 'api', 'device_actions', false, false, '', false);
VALUES('DEVICE_ISSUE_INVALID','{"endpoint":"/requests/wfhandler"}', 'api', 'device_actions', false, false, '', false);


INSERT INTO workflow.wfhsteps(ecode, hinfo, isd) VALUES
('DEVICE_ISSUE_RESOLVED', '[{"endpoint":"/registry/device-issues","sname":"Device Issue Resolved"}]', FALSE),
('DEVICE_ISSUE_INVALID', '[{"endpoint":"/registry/device-issues","sname":"Device Issue Invalid"}]', FALSE);

