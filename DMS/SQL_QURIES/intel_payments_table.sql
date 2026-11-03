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
-- Index on date for quick filtering
CREATE INDEX idx_m_payments_daily_eat ON intel.m_payments_daily (eat);

-- Index on imei for device-specific queries
CREATE INDEX idx_m_payments_daily_imei ON intel.m_payments_daily (imei);

-- Composite index if you frequently filter by bid + brid
CREATE INDEX idx_m_payments_daily_bid_brid ON intel.m_payments_daily (bid, brid);


SELECT * FROM intel.m_payments_daily order by pcount ASC

TRUNCATE TABLE intel.m_payments_daily