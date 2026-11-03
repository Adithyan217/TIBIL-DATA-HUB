--------------workflow.wfactions

CREATE INDEX IF NOT EXISTS idx_wfactions_ecode
ON workflow.wfactions (ecode);

--------------workflow.wfalog

CREATE INDEX IF NOT EXISTS idx_wfalog_aid
ON workflow.wfalog (aid);

CREATE INDEX IF NOT EXISTS idx_wfalog_eid
ON workflow.wfalog (eid);

----------------workflow.wfevtslog

CREATE INDEX IF NOT EXISTS idx_wfevtslog_ecode
ON workflow.wfevtslog (ecode);

-----------------workflow.wfhlog

CREATE INDEX IF NOT EXISTS idx_wfhlog_aid
ON workflow.wfhlog (aid);

CREATE INDEX IF NOT EXISTS idx_wfhlog_sid
ON workflow.wfhlog (sid);

CREATE INDEX IF NOT EXISTS idx_wfhlog_hstatus
ON workflow.wfhlog (hstatus);

CREATE INDEX IF NOT EXISTS idx_wfhlog_aid_hstatus_sid
ON workflow.wfhlog (aid,hstatus,sid);


ALTER TABLE workflow.actions 
ADD COLUMN category VARCHAR, 
ADD COLUMN isvisible BOOLEAN DEFAULT TRUE;
