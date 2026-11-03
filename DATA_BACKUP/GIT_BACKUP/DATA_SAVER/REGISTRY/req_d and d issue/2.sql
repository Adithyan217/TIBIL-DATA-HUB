SELECT * FROM registry.device_issues

DROP TABLE registry.device_issues

CREATE TABLE registry.device_issues (
    iid SERIAL PRIMARY KEY,
    bname VARCHAR,
	bid INTEGER,
    vpa VARCHAR,
    dname VARCHAR,
    brname VARCHAR,
    mname VARCHAR,
    mphno VARCHAR,
    issue_desc TEXT,
    status registry.di_status DEFAULT 'Open',
    eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    eid INTEGER NOT NULL,
    eby VARCHAR NOT NULL
);


-- CREATE INDEX IF NOT EXISTS idx_device_issues_bank
-- ON registry.device_issues(bank);

CREATE INDEX IF NOT EXISTS idx_device_issues_bname
ON registry.device_issues(bname);

CREATE INDEX IF NOT EXISTS idx_device_issues_bid
ON registry.device_issues(bid);

CREATE INDEX IF NOT EXISTS idx_device_issues_branch
ON registry.device_issues(brname);

CREATE INDEX IF NOT EXISTS idx_device_issues_device
ON registry.device_issues(dname);

CREATE INDEX IF NOT EXISTS idx_device_issues_merchant
ON registry.device_issues(mname);

CREATE INDEX IF NOT EXISTS idx_device_issues_vpa
ON registry.device_issues(vpa);

CREATE INDEX IF NOT EXISTS idx_device_issues_status
ON registry.device_issues(status);


-----------------------------FUNCTION
DROP FUNCTION IF EXISTS registry.raise_device_issues

CREATE OR REPLACE FUNCTION registry.raise_device_issues(
	rowid INTEGER,
	device_issue_id INTEGER,
	context VARCHAR,
    d_name VARCHAR,
	b_name VARCHAR,
	b_id INTEGER,
	br_name VARCHAR,
	v_name VARCHAR,
	m_name VARCHAR,
	m_phno VARCHAR ,
	di_status registry.di_status,
	d_issue TEXT,
	e_by VARCHAR,
	e_id INTEGER
	
	
)
RETURNS TABLE (
	row_id INTEGER,
	msg TEXT,
	iid INTEGER,
	deviceId VARCHAR,
	vpaId VARCHAR,
	merchantName VARCHAR,
	merchantphno VARCHAR ,
	status registry.di_status,
	issue TEXT,
	eventID INTEGER
	
	

) AS $$
DECLARE
	deviceissue_id INTEGER;
	devices_name VARCHAR;
    vpa_name VARCHAR;
    merchants_name VARCHAR;
	merchant_phno VARCHAR;
	issue_status registry.di_status;
	issue_description TEXT;
	event_id INTEGER;
	
BEGIN

	IF context = 'CREATE' THEN
		INSERT INTO registry.device_issues AS di(dname,bname,brname,vpa,mname,mphno,status,issue_desc,eby,eid,bid)  --added bid
		VALUES (d_name,b_name,br_name,v_name,m_name,m_phno,di_status,d_issue,e_by,e_id,b_id)							 -- added b_id
		RETURNING di.iid INTO deviceissue_id;
		RETURN QUERY SELECT 1,'ISSUE_CREATED',deviceissue_id,d_name,v_name,m_name,m_phno,di_status,d_issue,e_id;

	
	ELSIF context = 'UPDATE' THEN
	  IF EXISTS(SELECT 1 FROM registry.device_issues AS di WHERE di.iid = device_issue_id ) THEN
		UPDATE registry.device_issues AS di
			SET
				status = di_status,
				eby = e_by,
				eid = e_id
			WHERE di.iid = device_issue_id
		RETURNING dname,vpa,mname,mphno,di.status,issue_desc,eid INTO devices_name,vpa_name,merchants_name,merchant_phno,issue_status,issue_description,event_id ;
		RETURN QUERY SELECT 1,'ISSUE_UPDATED',device_issue_id,devices_name,vpa_name,merchants_name,merchant_phno,issue_status,issue_description,event_id;
	  ELSE 
	  	RETURN QUERY SELECT 1,'INVALID_IID',device_issue_id,devices_name,vpa_name,merchants_name,merchant_phno,issue_status,issue_description,event_id;
	  END IF;
	END IF;
		

END;
$$ LANGUAGE plpgsql;



SELECT * FROM registry.raise_device_issues(
	2,
	NULL,
	'CREATE'::VARCHAR,
	'device_2'::VARCHAR,	
	'bank_1'::VARCHAR,
	1,
	'branch_1'::VARCHAR,
	'vpa@1234'::VARCHAR,
	'merchant_1'::VARCHAR,
	'911234567890'::VARCHAR ,
	'Resolved'::registry.di_status,
	'asdfghjkl'::TEXT,
	'abc2'::VARCHAR,
	5
);
