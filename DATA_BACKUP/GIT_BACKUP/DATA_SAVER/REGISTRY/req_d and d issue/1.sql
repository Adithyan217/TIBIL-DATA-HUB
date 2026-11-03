SELECT * FROM registry.device_requests

CREATE TYPE registry.dr_status AS ENUM(
	'Open',
	'Allocated',
	'Dispatched',
	'Delivered'
);

-----------TABLE FOR DEVICE REQUESTS----------------

DROP TABLE registry.device_requests


CREATE TABLE registry.device_requests (
	drid SERIAL PRIMARY KEY,
	bname VARCHAR,
	bid INTEGER,
	brname VARCHAR ,
	mname VARCHAR ,
	minfo JSON ,
	status registry.dr_status DEFAULT 'Open',
	comment TEXT,
	eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	eby VARCHAR NOT NULL,
	eid INTEGER NOT NULL
);


CREATE INDEX IF NOT EXISTS idx_device_requests_bid
ON registry.device_requests(bid);
CREATE INDEX IF NOT EXISTS idx_device_requests_bname
ON registry.device_requests(bname);

CREATE INDEX IF NOT EXISTS idx_device_requests_brname
ON registry.device_requests(brname);

CREATE INDEX IF NOT EXISTS idx_device_requests_mname
ON registry.device_requests(mname);

CREATE INDEX IF NOT EXISTS idx_device_requests_status
ON registry.device_requests(status);

-----------------FUNCTION FOR DEVICE REQUESTS----------------

DROP FUNCTION IF EXISTS registry.request_for_device

CREATE OR REPLACE FUNCTION registry.request_for_device(
	rowid INTEGER,
	device_request_id INTEGER,
	context VARCHAR,
	b_name VARCHAR,
	b_id INTEGER,
	br_name VARCHAR,
	m_name VARCHAR,
	m_info JSON ,
	dr_status registry.dr_status,
	r_comment TEXT,
	e_by VARCHAR,
	e_id INTEGER
	
	
)
RETURNS TABLE (
	row_id INTEGER,
	msg TEXT,
	drid INTEGER,
	bankName VARCHAR,
	branchName VARCHAR,
	merchantName VARCHAR,
	merchantInfo JSON ,
	drStatus registry.dr_status,
	rcomment TEXT,
	eventID INTEGER
) AS $$
DECLARE
	devicerequest_id INTEGER;
	banks_name VARCHAR;
	branches_name VARCHAR;
	merchants_name VARCHAR;
	merchant_info JSON;
	request_status registry.dr_status;
	request_comment TEXT;
	event_id INTEGER;
	
BEGIN

	IF context = 'CREATE' THEN
		INSERT INTO registry.device_requests AS dr(bname,brname,mname,minfo,status,comment,eby,eid,bid)  -- bid added
		VALUES (b_name,br_name,m_name,m_info,dr_status,r_comment,e_by,e_id,b_id)							 -- added b_id
		RETURNING dr.drid INTO devicerequest_id;
		RETURN QUERY SELECT 1,'REQUEST_CREATED',devicerequest_id,b_name,br_name,m_name,m_info,dr_status,r_comment,e_id;
		-- RETURNING drid,bank,branch,merchant,minfo,status,eid INTO devicerequest_id,bname ,brname,mname,merchant_info,request_status,event_id ;
		-- RETURN QUERY SELECT 'REQUEST_CREATED',bname,brname,mname,merchant_info,request_status,event_id,device_request_id;
	
	
	ELSIF context = 'UPDATE' THEN
	  IF EXISTS(SELECT 1 FROM registry.device_requests AS dr WHERE dr.drid = device_request_id ) THEN
		UPDATE registry.device_requests AS dr
			SET
				status = dr_status,
				eby = e_by,
				eid = e_id
			WHERE dr.drid = device_request_id
		RETURNING bname,brname,mname,minfo,status,comment,eid INTO banks_name ,branches_name,merchants_name,merchant_info,request_status,request_comment,event_id ;
		RETURN QUERY SELECT 1,'REQUEST_UPDATED',device_request_id,banks_name,branches_name,merchants_name,merchant_info,request_status,request_comment,event_id;
	  ELSE 
	  	RETURN QUERY SELECT 1,'INVALID_DRID',device_request_id,banks_name,branches_name,merchants_name,merchant_info,request_status,request_comment,event_id;
	  END IF;
	END IF;
		

END;
$$ LANGUAGE plpgsql;


SELECT * FROM registry.request_for_device(
	101,
	NULL,
	'CREATE'::VARCHAR,
	'bank_1'::VARCHAR,
	1,
	'branch_1'::VARCHAR,
	'merchant_1'::VARCHAR,
	'{"accNo":123,"name":"abc","phone":1234}' ,
	'OPEN'::registry.dr_status,
	'asdfghjkl'::TEXT,
	'abc2'::VARCHAR,
	5
)