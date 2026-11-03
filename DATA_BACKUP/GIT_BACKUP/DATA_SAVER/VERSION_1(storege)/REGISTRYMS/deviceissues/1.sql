CREATE TYPE registry.di_status AS ENUM(
	'Open',
	'Resolved',
	'Invalid-Closed'
)




CREATE TABLE registry.device_issues (
    iid SERIAL PRIMARY KEY,
    bank VARCHAR,
    vpa VARCHAR,
    device VARCHAR,
    branch VARCHAR,
    merchant VARCHAR,
    mphno VARCHAR,
    issue_desc TEXT,
    status registry.di_status DEFAULT 'Open',
    eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    eid INTEGER NOT NULL,
    eby VARCHAR NOT NULL
);


CREATE OR REPLACE FUNCTION registry.raise_device_issues(
	device_issue_id INTEGER,
	context VARCHAR,
    d_name VARCHAR,
	b_name VARCHAR,
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
	device_name VARCHAR;
    vpa_name VARCHAR;
    merchant_name VARCHAR;
	merchant_phno VARCHAR;
	issue_status registry.di_status;
	issue_description TEXT;
	event_id INTEGER;
	
BEGIN

	IF context = 'CREATE' THEN
		INSERT INTO registry.device_issues AS di(device,bank,branch,vpa,merchant,mphno,status,issue_desc,eby,eid)
		VALUES (d_name,b_name,br_name,v_name,m_name,m_phno,di_status,d_issue,e_by,e_id)
		RETURNING di.iid INTO deviceissue_id;
		RETURN QUERY SELECT 'ISSUE_CREATED',deviceissue_id,d_name,v_name,m_name,m_phno,di_status,d_issue,e_id;

	
	ELSIF context = 'UPDATE' THEN
	  IF EXISTS(SELECT 1 FROM registry.device_issues AS di WHERE di.iid = device_issue_id ) THEN
		UPDATE registry.device_issues AS di
			SET
				status = di_status,
				eby = e_by,
				eid = e_id
			WHERE di.iid = device_issue_id
		RETURNING device,vpa,merchant,mphno,di.status,issue_desc,eid INTO device_name,vpa_name,merchant_name,merchant_phno,issue_status,issue_description,event_id ;
		RETURN QUERY SELECT 'ISSUE_UPDATED',device_issue_id,device_name,vpa_name,merchant_name,merchant_phno,issue_status,issue_description,event_id;
	  ELSE 
	  	RETURN QUERY SELECT 'INVALID_IID',device_issue_id,device_name,vpa_name,merchant_name,merchant_phno,issue_status,issue_description,event_id;
	  END IF;
	END IF;
		

END;
$$ LANGUAGE plpgsql;


SELECT * FROM registry.raise_device_issues(
	2,
	'UPDATE'::VARCHAR,
	'device_2'::VARCHAR,	
	'bank_1'::VARCHAR,
	'branch_1'::VARCHAR,
	'vpa@1234'::VARCHAR,
	'merchant_1'::VARCHAR,
	'911234567890'::VARCHAR ,
	'Resolved'::registry.di_status,
	'asdfghjkl'::TEXT,
	'abc2'::VARCHAR,
	5
);
