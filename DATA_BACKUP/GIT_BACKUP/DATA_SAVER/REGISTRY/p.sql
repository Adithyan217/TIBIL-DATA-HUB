CREATE OR REPLACE FUNCTION registry.device_request_validator_writer(
	rowid INTEGER,
	device_request_id INTEGER,
	context VARCHAR,
	b_name VARCHAR,
	b_id INTEGER,
	br_name VARCHAR,
	m_name VARCHAR,
	dr_status registry.dr_status,
	s_provider VARCHAR,--
	d_quantity INTEGER,--
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
	status registry.dr_status,
	eventID INTEGER,--
    simProvider VARCHAR,--
	deviceQuantity INTEGER,--
    merchantType VARCHAR,--
	eventBY VARCHAR--
) AS $$
DECLARE
	devicerequest_id INTEGER;
	banks_name VARCHAR;
	branches_name VARCHAR;
	merchants_name VARCHAR;
	merchant_info JSON;
	request_status registry.dr_status;
	event_id INTEGER;
	event_by VARCHAR;--
	simprovider VARCHAR;--
	devicequantity INTEGER;--
	merchanttype VARCHAR;---
	
BEGIN

	select minfo INTO merchant_info FROM registry.merchants WHERE mname = m_name;
	select merchant_type INTO merchanttype FROM registry.merchant_types where mtid = (select mtid from registry.merchants where mname = m_name)
	

	IF context = 'CREATE' THEN
		INSERT INTO registry.device_requests AS dr(bname,brname,mname,minfo,status,eby,eid,bid,sim_provider,device_quantity,merchant_type)  -- bid added
		VALUES (b_name,br_name,m_name,merchant_info,dr_status,e_by,e_id,b_id,s_provider,d_quantity,merchanttype)							 -- added b_id
		RETURNING drid,bname,brname,mname,minfo,dr.status,eid,eby,sim_provider,device_quantity,merchant_type INTO devicerequest_id,banks_name ,branches_name,merchants_name,merchant_info,request_status,event_id,event_by,simprovider,devicequantity,merchanttype; ;
		RETURN QUERY SELECT rowid,'REQUEST_CREATED',devicerequest_id,banks_name, branches_name, merchants_name,merchant_info,request_status,event_id,simprovider,devicequantity,merchanttype,event_by;
	
	
	ELSIF context = 'UPDATE' THEN
	  IF EXISTS(SELECT 1 FROM registry.device_requests AS dr WHERE dr.eid = e_id ) THEN
		UPDATE registry.device_requests AS dr
			SET
				status = dr_status,
				eby = e_by,
				eid = e_id
			WHERE dr.eid = e_id
		RETURNING bname,brname,mname,minfo,dr.status,eid,eby,sim_provider,device_quantity,merchant_type INTO banks_name ,branches_name,merchants_name,merchant_info,request_status,event_id,event_by,simprovider,devicequantity,merchanttype; ;
		RETURN QUERY SELECT rowid,'REQUEST_UPDATED',device_request_id,banks_name,branches_name,merchants_name,merchant_info,request_status,event_id,simprovider,devicequantity,merchanttype,event_by;
	  ELSE 
	  	RETURN QUERY SELECT rowid,'INVALID_DRID',device_request_id,banks_name,branches_name,merchants_name,merchant_info,request_status,event_id,simprovider,devicequantity,merchanttype,event_by;
	  END IF;
	END IF;
		

END;
$$ LANGUAGE plpgsql;