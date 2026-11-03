--------------workflow.wfactions

CREATE INDEX idx_wfactions_ecode
ON workflow.wfactions (ecode);

--------------workflow.wfalog

CREATE INDEX idx_wfalog_aid
ON workflow.wfalog (aid);

CREATE INDEX idx_wfalog_eid
ON workflow.wfalog (eid);

----------------workflow.wfevtslog

CREATE INDEX idx_wfevtslog_ecode
ON workflow.wfevtslog (ecode);

-----------------workflow.wfhlog

CREATE INDEX idx_wfhlog_aid
ON workflow.wfhlog (aid);

CREATE INDEX idx_wfhlog_sid
ON workflow.wfhlog (sid);

CREATE INDEX idx_wfhlog_hstatus
ON workflow.wfhlog (hstatus);

CREATE INDEX idx_wfhlog_aid_hstatus_sid
ON workflow.wfhlog (aid,hstatus,sid);