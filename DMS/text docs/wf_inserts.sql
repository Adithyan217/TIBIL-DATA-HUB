INSERT INTO workflow.wfactions (ecode, ainfo, htype, isd, isvisible, category, vcode, ischainable) VALUES
('ONBOARD_BANK_PROCESSED', '{"endpoint":"/requests/wfhandler"}', 'api', false, true, 'intel_actions', '', false),
('ONBOARD_BRANCH_PROCESSED', '{"endpoint":"/requests/wfhandler"}', 'api', false, true, 'intel_actions', '', false),
('ONBOARD_MERCHANT_PROCESSED', '{"endpoint":"/requests/wfhandler"}', 'api', false, true, 'intel_actions', '', false),
('DEVICE_ISSUE_PROCESSED', '{"endpoint":"/requests/wfhandler"}', 'api', false, true, 'intel_actions', '', false),
('DEVICE_ISSUE_UPDATE_PROCESSED', '{"endpoint":"/requests/wfhandler"}', 'api', false, true, 'intel_actions', '', false),
('ONBOARD_DEVICE_PROCESSED', '{"endpoint":"/requests/wfhandler"}', 'api', false, true, 'intel_actions', '', false),
('ONBOARD_DEVICE_ALLOCATE_TO_BANK_PROCESSED', '{"endpoint":"/requests/wfhandler"}', 'api', false, true, 'intel_actions', '', false),
('ONBOARD_DEVICE_ALLOCATE_TO_BRANCH_PROCESSED', '{"endpoint":"/requests/wfhandler"}', 'api', false, true, 'intel_actions', '', false),
('ONBOARD_DEVICE_ALLOCATE_TO_MERCHANT_PROCESSED', '{"endpoint":"/requests/wfhandler"}', 'api', false, true, 'intel_actions', '', false),
('ONBOARD_DEVICE_ONBOARD_DEVICE_PROCESSED', '{"endpoint":"/requests/wfhandler"}', 'api', false, true, 'intel_actions', '', false),
('ALLOCATE_TO_BANK_PROCESSED', '{"endpoint":"/requests/wfhandler"}', 'api', false, true, 'intel_actions', '', false),
('ALLOCATE_TO_BRANCH_PROCESSED', '{"endpoint":"/requests/wfhandler"}', 'api', false, true, 'intel_actions', '', false),
('ALLOCATE_TO_MERCHANT_PROCESSED', '{"endpoint":"/requests/wfhandler"}', 'api', false, true, 'intel_actions', '', false),
('DEVICE_REQUEST_PROCESSED', '{"endpoint":"/requests/wfhandler"}', 'api', false, true, 'intel_actions', '', false),
('DEVICE_REQUEST_DELIVERED_PROCESSED', '{"endpoint":"/requests/wfhandler"}', 'api', false, true, 'intel_actions', '', false),
('DEACTIVATE_DEVICE_PROCESSED', '{"endpoint":"/requests/wfhandler"}', 'api', false, true, 'intel_actions', null, false),
('PAYMENT_PROCESSED', '{"endpoint":"/requests/wfhandler"}', 'api', false, true, 'intel_actions', '', false);



INSERT INTO workflow.wfhsteps (ecode, hinfo, isd) VALUES
('ONBOARD_BANK_PROCESSED', '[{"endpoint":"/intel/aggregate","sname":"Metrics for Onboard Bank Processed","method":"post"}]', false),
('ONBOARD_BRANCH_PROCESSED', '[{"endpoint":"/intel/aggregate","sname":"Metrics for Onboard Branch Processed","method":"post"}]', false),
('ONBOARD_MERCHANT_PROCESSED', '[{"endpoint":"/intel/aggregate","sname":"Metrics for Onboard Merchant Processed","method":"post"}]', false),
('DEVICE_ISSUE_PROCESSED', '[{"endpoint":"/intel/aggregate","sname":"Metrics for Device Issue Processed","method":"post"}]', false),
('DEVICE_ISSUE_UPDATE_PROCESSED', '[{"endpoint":"/intel/aggregate","sname":"Metrics for Device Issue Update Processed","method":"post"}]', false),
('ONBOARD_DEVICE_PROCESSED', '[{"endpoint":"/intel/aggregate","sname":"Metrics for Onboard Device Processed","method":"post"}]', false),
('ONBOARD_DEVICE_ALLOCATE_TO_BANK_PROCESSED', '[{"endpoint":"/intel/aggregate","sname":"Metrics for Onboard Device Allocate To Bank Processed","method":"post"}]', false),
('ONBOARD_DEVICE_ALLOCATE_TO_BRANCH_PROCESSED', '[{"endpoint":"/intel/aggregate","sname":"Metrics for Onboard Device Allocate To Branch Processed","method":"post"}]', false),
('ONBOARD_DEVICE_ALLOCATE_TO_MERCHANT_PROCESSED', '[{"endpoint":"/intel/aggregate","sname":"Metrics for Onboard Device Allocate To Merchant Processed","method":"post"}]', false),
('ONBOARD_DEVICE_ONBOARD_DEVICE_PROCESSED', '[{"endpoint":"/intel/aggregate","sname":"Metrics for Onboard Device Onboard Device Processed","method":"post"}]', false),
('ALLOCATE_TO_BANK_PROCESSED', '[{"endpoint":"/intel/aggregate","sname":"Metrics for Allocate To Bank Processed","method":"post"}]', false),
('ALLOCATE_TO_BRANCH_PROCESSED', '[{"endpoint":"/intel/aggregate","sname":"Metrics for Allocate To Branch Processed","method":"post"}]', false),
('ALLOCATE_TO_MERCHANT_PROCESSED', '[{"endpoint":"/intel/aggregate","sname":"Metrics for Allocate To Merchant Processed","method":"post"}]', false),
('DEVICE_REQUEST_PROCESSED', '[{"endpoint":"/intel/aggregate","sname":"Metrics for Device Request Processed","method":"post"}]', false),
('DEVICE_REQUEST_DELIVERED_PROCESSED', '[{"endpoint":"/intel/aggregate","sname":"Metrics for Device Request Delivered Processed","method":"post"}]', false),
('DEACTIVATE_DEVICE_PROCESSED', '[{"endpoint":"/intel/aggregate","sname":"Deactivate Device Metrics","method":"post"}]', false),
('PAYMENT_PROCESSED', '[{"endpoint":"/intel/payment/aggregate","sname":"Metrics for Payment Processed","method":"post"}]', false);



