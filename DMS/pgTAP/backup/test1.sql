BEGIN;

SELECT plan(3);

INSERT INTO registry.banks (bname, baddr, bevt, binfo, eby, eid)
VALUES ('Ex Bank', 'Address', 'BANK_ONBOARDED', '{"info": "test"}', 'User1', 1)
;

SELECT is(
  array_to_string(registry.bank_validator('Ex Bank', NULL, NULL, '{}'::jsonb), ','),
  'BANK_REPEATED',
  'Testing existing bank name'
);

SELECT is(
  array_to_string(registry.bank_validator('Nw Bank', NULL, NULL, '{}'::jsonb), ','),
  NULL,
  'Testing new bank name'
);

SELECT is(
  array_to_string(registry.bank_validator(NULL, 1, NULL, '{}'::jsonb), ','),
  'EMPTY_UPDATE',
  'Testing Empty Update'
);

SELECT * FROM finish();

ROLLBACK;
