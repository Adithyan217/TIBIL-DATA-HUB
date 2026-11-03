DROP TABLE IF EXISTS registry.routes CASCADE;

CREATE TABLE registry.routes(
rid SERIAL PRIMARY KEY,
rcontext VARCHAR UNIQUE,
mfid INTEGER REFERENCES registry.mf(mfid),
isd BOOLEAN DEFAULT false,
eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_routes_rcontext 
ON registry.routes(rcontext);

CREATE INDEX IF NOT EXISTS idx_routes_mfid
ON registry.routes(mfid);