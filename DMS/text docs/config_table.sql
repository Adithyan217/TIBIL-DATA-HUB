CREATE TABLE intel.metric_flow (
    cid SERIAL PRIMARY KEY,
    ecode TEXT NOT NULL,
    config JSONB NOT NULL,
    isd BOOLEAN DEFAULT FALSE
);


-- select * from intel.metric_flow


-- ONBOARD BANK
INSERT INTO intel.metric_flow ( ecode, config, isd) VALUES
( 'ONBOARD_BANK_PROCESSED',
$${
  "headers": ["row_id", "bid"],
  "iterators": [
    { "iterator": "intel.mi_bank_incrementer", "schema": ["row_id", "bid"] }
  ]
}$$::json, false);

-- ONBOARD BRANCH
INSERT INTO intel.metric_flow ( ecode, config, isd) VALUES
( 'ONBOARD_BRANCH_PROCESSED',
$${
  "headers": ["row_id", "bid", "brid"],
  "iterators": [
    { "iterator": "intel.mi_branch_incrementer", "schema": ["row_id", "bid", "brid"] }
  ]
}$$::json, false);

-- ONBOARD MERCHANT
INSERT INTO intel.metric_flow ( ecode, config, isd) VALUES
( 'ONBOARD_MERCHANT_PROCESSED',
$${
  "headers": ["row_id", "bid", "brid"],
  "iterators": [
    { "iterator": "intel.mi_merchant_incrementer", "schema": ["row_id", "bid", "brid"] }
  ]
}$$::json, false);

-- DEVICE ISSUE OPEN
INSERT INTO intel.metric_flow ( ecode, config, isd) VALUES
('DEVICE_ISSUE_PROCESSED',
$${
  "headers": ["row_id", "bid", "brid"],
  "iterators": [
    { "iterator": "intel.mi_di_open_incrementer", "schema": ["row_id", "bid", "brid"] }
  ]
}$$::json, false);

-- DEVICE ISSUE UPDATE
INSERT INTO intel.metric_flow ( ecode, config, isd) VALUES
( 'DEVICE_ISSUE_UPDATE_PROCESSED',
$${
  "headers": ["row_id", "bid", "brid"],
  "iterators": [
    { "iterator": "intel.mi_di_open_decrementer", "schema": ["row_id", "bid", "brid"] },
    { "iterator": "intel.mi_di_closed_incrementer", "schema": ["row_id", "bid", "brid"] }
  ]
}$$::json, false);


-- ONBOARD TO INVENTORY
INSERT INTO intel.metric_flow ( ecode, config, isd) VALUES
( 'ONBOARD_DEVICE_ONBOARD_DEVICE_PROCESSED',
$${
  "headers": ["row_id"],
  "iterators": [
    { "iterator": "intel.mi_incount_incrementer", "schema": ["row_id"] }
  ]
}$$::json, false);

-- ALLOCATE TO BANK (for onboard device)
INSERT INTO intel.metric_flow ( ecode, config, isd) VALUES
( 'ONBOARD_DEVICE_ALLOCATE_TO_BANK_PROCESSED',
$${
  "headers": ["row_id", "bid"],
  "iterators": [
    { "iterator": "intel.mi_bdcount_incrementer", "schema": ["row_id", "bid"] }
  ]
}$$::json, false);

-- ALLOCATE TO BRANCH (for onboard device)
INSERT INTO intel.metric_flow ( ecode, config, isd) VALUES
( 'ONBOARD_DEVICE_ALLOCATE_TO_BRANCH_PROCESSED',
$${
  "headers": ["row_id", "bid", "brid"],
  "iterators": [
    { "iterator": "intel.mi_brdcount_incrementer", "schema": ["row_id", "bid", "brid"] }
  ]
}$$::json, false);

-- ALLOCATE TO MERCHANT (for onboard device)
INSERT INTO intel.metric_flow ( ecode, config, isd) VALUES
( 'ONBOARD_DEVICE_ALLOCATE_TO_MERCHANT_PROCESSED',
$${
  "headers": ["row_id", "bid", "brid"],
  "iterators": [
    { "iterator": "intel.mi_mdcount_incrementer", "schema": ["row_id", "bid", "brid"] }
  ]
}$$::json, false);

-- ALLOCATE TO BANK
INSERT INTO intel.metric_flow ( ecode, config, isd) VALUES
( 'ALLOCATE_TO_BANK_PROCESSED',
$${
  "headers": ["row_id", "bid"],
  "iterators": [
    { "iterator": "intel.mi_incount_decrementer", "schema": ["row_id"] },
    { "iterator": "intel.mi_bdcount_incrementer", "schema": ["row_id", "bid"] }
  ]
}$$::json, false);

-- ALLOCATE TO BRANCH
INSERT INTO intel.metric_flow ( ecode, config, isd) VALUES
( 'ALLOCATE_TO_BRANCH_PROCESSED',
$${
  "headers": ["row_id", "bid", "brid"],
  "iterators": [
    { "iterator": "intel.mi_bdcount_decrementer", "schema": ["row_id", "bid"] },
    { "iterator": "intel.mi_brdcount_incrementer", "schema": ["row_id", "bid", "brid"] }
  ]
}$$::json, false);

-- ALLOCATE TO MERCHANT
INSERT INTO intel.metric_flow ( ecode, config, isd) VALUES
( 'ALLOCATE_TO_MERCHANT_PROCESSED',
$${
  "headers": ["row_id", "bid", "brid"],
  "iterators": [
	{ "iterator": "intel.mi_brdcount_decrementer", "schema": ["row_id", "bid", "brid"] },
	{ "iterator": "intel.mi_mdcount_incrementer", "schema": ["row_id", "bid", "brid"] }
  ]
}$$::json, false);


-- DEVICE_REQUEST_PROCESSED → mi_dr_open_incrementer
INSERT INTO intel.metric_flow (ecode, config, isd)
VALUES (
  'DEVICE_REQUEST_PROCESSED',
  '{
    "headers": ["row_id", "bid", "brid"],
    "iterators": [
      {
        "schema": ["row_id", "bid", "brid"],
        "iterator": "intel.mi_dr_open_incrementer"
      }
    ]
  }',
  false
);

-- DEVICE_REQUEST_DELIVERED_PROCESSED → mi_dr_open_decrementer + mi_dr_closed_incrementer
INSERT INTO intel.metric_flow (ecode, config, isd)
VALUES (
  'DEVICE_REQUEST_DELIVERED_PROCESSED',
  '{
    "headers": ["row_id", "bid", "brid"],
    "iterators": [
      {
        "schema": ["row_id", "bid", "brid"],
        "iterator": "intel.mi_dr_open_decrementer"
      },
      {
        "schema": ["row_id", "bid", "brid"],
        "iterator": "intel.mi_dr_closed_incrementer"
      }
    ]
  }',
  false
);


----------------PAYMENTS

INSERT INTO intel.metric_flow (ecode, config, isd)
VALUES (
  'PAYMENT_PROCESSED',
  '{
    "headers": ["row_id", "bid", "brid", "imei", "amt"],
    "iterators": [
      {
        "schema": ["row_id", "bid", "brid", "imei", "amt"],
        "iterator": "intel.mi_payments_incrementer"
      }
    ]
  }',
  false
);


-------------DEACTIVATE_DEVICE--------------
INSERT INTO intel.metric_flow (ecode, config, isd)
VALUES (
  'DEACTIVATE_DEVICE_PROCESSED',
  '{
    "headers": ["row_id", "bid", "brid", "last_action"],
    "iterators": [
      {
        "schema": ["row_id", "bid", "brid", "last_action"],
        "iterator": "intel.mi_ddcount_incrementer"
      }
    ]
  }',
  false
);
