CREATE SCHEMA IF NOT EXISTS users;

CREATE TABLE IF NOT EXISTS users.ufactors (
    uid SERIAL PRIMARY KEY,
    idf VARCHAR(15) NOT NULL, 
    fcontext VARCHAR(20) NOT NULL,
    expires_at BIGINT,
    fval VARCHAR,
    isd BOOLEAN DEFAULT FALSE,
    CONSTRAINT idf_fcontext_unq UNIQUE (idf, fcontext)
        INCLUDE (idf, fcontext)
);
