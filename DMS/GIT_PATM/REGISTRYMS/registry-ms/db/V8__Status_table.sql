---------------- STATUS 

CREATE TABLE registry.status (
	stid SERIAL PRIMARY KEY,
	context VARCHAR,
	status VARCHAR,
    priority INTEGER
);

CREATE INDEX IF NOT EXISTS idx_status_entity
ON registry.status (context);

INSERT INTO registry.status (context,status,priority)
VALUES 
('device','In Inventory',1),
('device','Enabled',2),
('device','Not Enabled',3),
('device_request','Allocated',1),
('device_request','Dispatched',2),
('device_request','Delivered',3),
('onboard_device','To Inventory',1),
('onboard_device','Allocated to Bank',2),
('onboard_device','Allocated to Branch',3),
('onboard_device','Allocated to Merchant',4),
('device_issues','Resolved',1),
('device_issues','Invalid-Closed',2)
;