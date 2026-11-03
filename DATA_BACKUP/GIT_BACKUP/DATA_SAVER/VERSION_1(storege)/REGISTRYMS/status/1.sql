---------------- STATUS 

CREATE TABLE registry.status (
	stid SERIAL PRIMARY KEY,
	context VARCHAR,
	status VARCHAR
);

CREATE INDEX IF NOT EXISTS idx_status_entity
ON registry.status (context)

INSERT INTO registry.status (context,status)
VALUES 
('device','In Inventory'),
('device','Allocated'),
('device_request','Dispatched'),
('device_request','Delivered'),
('onboard_device','To Inventory'),
('onboard_device','Allocated to Bank'),
('onboard_device','Allocated to Branch'),
('onboard_device','Allocated to Merchant'),
('device_issues','Resolved'),
('device_issues','Invalid - Closed')
;