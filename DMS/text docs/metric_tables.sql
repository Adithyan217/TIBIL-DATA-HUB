-- DEVICE METRIC TABLE
CREATE TABLE IF NOT EXISTS intel.m_devices (
  pid SERIAL PRIMARY KEY,
  bid INT NOT NULL,
  brid INT NOT NULL,
  bdcount INT DEFAULT 0,
  brdcount INT DEFAULT 0,
  mdcount INT DEFAULT 0,
  incount INT DEFAULT 0,
  ddcount INT DEFAULT 0,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  isd BOOLEAN DEFAULT FALSE,
  UNIQUE (bid, brid)
);

-- BANK METRIC TABLE
CREATE TABLE IF NOT EXISTS intel.m_banks (
  pid SERIAL PRIMARY KEY,
  bid INT UNIQUE NOT NULL,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  isd BOOLEAN DEFAULT FALSE
);

-- BRANCH METRIC TABLE
CREATE TABLE IF NOT EXISTS intel.m_branches (
  pid SERIAL PRIMARY KEY,
  bid INT NOT NULL,
  brid INT NOT NULL,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  isd BOOLEAN DEFAULT FALSE,
  UNIQUE (bid, brid)
);

-- MERCHANT METRIC TABLE
CREATE TABLE IF NOT EXISTS intel.m_merchants (
  pid SERIAL PRIMARY KEY,
  bid INT NOT NULL,
  brid INT NOT NULL,
  mcount INT DEFAULT 0,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  isd BOOLEAN DEFAULT FALSE,
  UNIQUE (bid, brid)
);

-- DEVICE-ISSUE METRIC TABLE
CREATE TABLE IF NOT EXISTS intel.m_device_issues (
  pid SERIAL PRIMARY KEY,
  bid INT NOT NULL,
  brid INT NOT NULL,
  opencount INT DEFAULT 0,
  closedcount INT DEFAULT 0,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (bid, brid)
);

-- DEVICE-REQUEST METRIC TABLE
CREATE TABLE IF NOT EXISTS intel.m_device_request (
  pid SERIAL PRIMARY KEY,
  bid INT NOT NULL,
  brid INT NOT NULL,
  opencount INT DEFAULT 0,
  closedcount INT DEFAULT 0,
  eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (bid, brid)
);


-----PAYMENTS TABLE

CREATE TABLE IF NOT EXISTS intel.m_payments_daily (
  pid SERIAL PRIMARY KEY,
  bid INT NOT NULL,
  brid INT NOT NULL,
  pcount INT DEFAULT 0,
  imei VARCHAR NOT NULL,
  ptotal NUMERIC(15, 2) DEFAULT 0.00,
  eat DATE NOT NULL DEFAULT CURRENT_DATE, 
  UNIQUE (bid, brid, eat, imei)
);
CREATE INDEX idx_m_payments_daily_eat ON intel.m_payments_daily (eat);

CREATE INDEX idx_m_payments_daily_imei ON intel.m_payments_daily (imei);

CREATE INDEX idx_m_payments_daily_bid_brid ON intel.m_payments_daily (bid, brid);

