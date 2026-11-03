INSERT INTO workflow.wfactions (ecode, ainfo, htype)
VALUES
    ('ONBOARD_BANK', '{"endpoint":"/wfhandler"}', 'api'),
    ('ONBOARD_BRANCH', '{"endpoint":"/wfhandler"}', 'api'),
    ('ONBOARD_DEVICE', '{"endpoint":"/wfhandler"}', 'api'),
    ('ONBOARD_MANUFACTURER', '{"endpoint":"/wfhandler"}', 'api'),
    ('ONBOARD_MERCHANT', '{"endpoint":"/wfhandler"}', 'api'),
    ('ONBOARD_FIRMWARE', '{"endpoint":"/wfhandler"}', 'api'),
    ('ONBOARD_DEVICE_MODEL', '{"endpoint":"/wfhandler"}', 'api'),
    ('ONBOARD_VPA', '{"endpoint":"/wfhandler"}', 'api'),
    ('BIND_DEVICE', '{"endpoint":"/wfhandler"}', 'api'),
    ('ALLOCATE_TO_BANK', '{"endpoint":"/wfhandler"}', 'api'),
    ('ALLOCATE_TO_BRANCH', '{"endpoint":"/wfhandler"}', 'api'),
    ('ALLOCATE_TO_MERCHANT', '{"endpoint":"/wfhandler"}', 'api'),
    ('DEACTIVATE_DEVICE', '{"endpoint":"/wfhandler"}', 'api'),
    ('DEACTIVATE_VPA', '{"endpoint":"/wfhandler"}', 'api'),
    ('DEACTIVATE_MERCHANT', '{"endpoint":"/wfhandler"}', 'api'),
    ('DEACTIVATE_BRANCH', '{"endpoint":"/wfhandler"}', 'api'),
    ('UPDATE_BANK', '{"endpoint":"/wfhandler"}', 'api'),
    ('UPDATE_BRANCH', '{"endpoint":"/wfhandler"}', 'api'),
    ('UPDATE_DEVICE', '{"endpoint":"/wfhandler"}', 'api'),
    ('UPDATE_MERCHANT', '{"endpoint":"/wfhandler"}', 'api'),
    ('UPDATE_MANUFACTURER', '{"endpoint":"/wfhandler"}', 'api'),
    ('DEACTIVATE_BANK', '{"endpoint":"/wfhandler"}', 'api'),
    ('UNBIND_DEVICE', '{"endpoint":"/wfhandler"}', 'api'),
    ('DELETE_VPA', '{"endpoint":"/wfhandler"}', 'api');


INSERT INTO workflow.wfsteps (ecode, hinfo)
VALUES
    ('ONBOARD_BANK', '[{"endpoint":"/registry/banks"}]'),
    ('ONBOARD_BRANCH', '[{"endpoint":"/registry/branches"}]'),
    ('ONBOARD_DEVICE', '[{"endpoint":"/registry/devices"}]'),
    ('ONBOARD_MANUFACTURER', '[{"endpoint":"/registry/mf"}]'),
    ('ONBOARD_MERCHANT', '[{"endpoint":"/registry/merchants"}]'),
    ('ONBOARD_FIRMWARE', '[{"endpoint":"/registry/firmwares"}]'),
    ('ONBOARD_DEVICE_MODEL', '[{"endpoint":"/registry/models"}]'),
    ('ONBOARD_VPA', '[{"endpoint":"/registry/vpas"}]'),
    ('BIND_DEVICE', '[{"endpoint":"/registry/sb"}]'),
    ('ALLOCATE_TO_BANK', '[{"endpoint":"/registry/sb"}]'),
    ('ALLOCATE_TO_BRANCH', '[{"endpoint":"/registry/sb"}]'),
    ('ALLOCATE_TO_MERCHANT', '[{"endpoint":"/registry/sb"}]'),
    ('DEACTIVATE_DEVICE', '[{"endpoint":"/registry/sb"}]'),
    ('DEACTIVATE_BRANCH', '[{"endpoint":"/registry/sb"}]'),
    ('DEACTIVATE_VPA', '[{"endpoint":"/registry/sb"}]'),
    ('DEACTIVATE_MERCHANT', '[{"endpoint":"/registry/sb"}]'),
    ('UPDATE_BANK', '[{"endpoint":"/registry/banks"}]'),
    ('UPDATE_BRANCH', '[{"endpoint":"/registry/branches"}]'),
    ('UPDATE_DEVICE', '[{"endpoint":"/registry/devices"}]'),
    ('UPDATE_MERCHANT', '[{"endpoint":"/registry/merchants"}]'),
    ('UPDATE_MANUFACTURER', '[{"endpoint":"/registry/mf"}]'),
    ('DEACTIVATE_BANK', '[{"endpoint":"/registry/sb"}]'),
    ('UNBIND_DEVICE', '[{"endpoint":"/registry/sb"}]'),
    ('DELETE_VPA', '[{"endpoint":"/registry/sb"}]');


ALTER TABLE workflow.wfalog
DROP CONSTRAINT wfalog_aid_fkey;

ALTER TABLE workflow.wfalog
ADD CONSTRAINT wfalog_aid_fkey
FOREIGN KEY (aid)
REFERENCES workflow.wfactions (aid);