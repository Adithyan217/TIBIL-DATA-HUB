CREATE TYPE registry.dr_status AS ENUM(
	'Open',
	'Allocated',
	'Dispatched',
	'Delivered'
)


CREATE TABLE registry.device_requests (
	drid SERIAL PRIMARY KEY,
	bank VARCHAR ,
	branch VARCHAR ,
	merchant VARCHAR ,
	minfo JSON ,
	status registry.dr_status DEFAULT 'Open',
	comment TEXT,
	eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	eby VARCHAR NOT NULL,
	eid INTEGER NOT NULL
)



CREATE OR REPLACE FUNCTION registry.request_for_device(
	device_request_id INTEGER,
	context VARCHAR,
	b_name VARCHAR,
	br_name VARCHAR,
	m_name VARCHAR,
	m_info JSON ,
	dr_status registry.dr_status,
	r_comment TEXT,
	e_by VARCHAR,
	e_id INTEGER 
	
)
RETURNS TABLE (
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
	bank_name VARCHAR;
	branch_name VARCHAR;
	merchant_name VARCHAR;
	merchant_info JSON;
	request_status registry.dr_status;
	request_comment TEXT;
	event_id INTEGER;
	
BEGIN

	IF context = 'CREATE' THEN
		INSERT INTO registry.device_requests AS dr(bank,branch,merchant,minfo,status,comment,eby,eid)
		VALUES (b_name,br_name,m_name,m_info,dr_status,r_comment,e_by,e_id)
		RETURNING dr.drid INTO devicerequest_id;
		RETURN QUERY SELECT 'REQUEST_CREATED',devicerequest_id,b_name,br_name,m_name,m_info,dr_status,r_comment,e_id;
		-- RETURNING drid,bank,branch,merchant,minfo,status,eid INTO devicerequest_id,bank_name ,branch_name,merchant_name,merchant_info,request_status,event_id ;
		-- RETURN QUERY SELECT 'REQUEST_CREATED',bank_name,branch_name,merchant_name,merchant_info,request_status,event_id,device_request_id;
	
	
	ELSIF context = 'UPDATE' THEN
	  IF EXISTS(SELECT 1 FROM registry.device_requests AS dr WHERE dr.drid = device_request_id ) THEN
		UPDATE registry.device_requests AS dr
			SET
				status = dr_status,
				eby = e_by,
				eid = e_id
			WHERE dr.drid = device_request_id
		RETURNING bank,branch,merchant,minfo,status,comment,eid INTO bank_name ,branch_name,merchant_name,merchant_info,request_status,request_comment,event_id ;
		RETURN QUERY SELECT 'REQUEST_UPDATED',device_request_id,bank_name,branch_name,merchant_name,merchant_info,request_status,request_comment,event_id;
	  ELSE 
	  	RETURN QUERY SELECT 'INVALID_DRID',device_request_id,bank_name,branch_name,merchant_name,merchant_info,request_status,request_comment,event_id;
	  END IF;
	END IF;
		

END;
$$ LANGUAGE plpgsql;


SELECT * FROM registry.request_for_device(
	101,
	'UPDATE'::VARCHAR,
	'bank_1'::VARCHAR,
	'branch_1'::VARCHAR,
	'merchant_1'::VARCHAR,
	'{"accNo":123,"name":"abc","phone":1234}' ,
	'ALLOCATED'::registry.dr_status,
	'asdfghjkl'::TEXT,
	'abc2'::VARCHAR,
	5
)