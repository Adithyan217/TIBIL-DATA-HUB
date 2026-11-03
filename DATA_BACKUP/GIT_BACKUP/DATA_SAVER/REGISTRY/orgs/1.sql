CREATE TABLE registry.orgs (
oid SERIAL PRIMARY KEY,
oname VARCHAR,
otype VARCHAR,
eat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
isd BOOLEAN DEFAULT false,
isa BOOLEAN DEFAULT true);

INSERT INTO registry.orgs(oname,otype)
VALUES ('pocketatm','ORG')

CREATE INDEX IF NOT EXISTS idx_orgs_oname ON registry.orgs(oname);
CREATE INDEX IF NOT EXISTS idx_orgs_otype ON registry.orgs(otype);

SELECT * FROM registry.orgs

CREATE OR REPLACE FUNCTION registry.bank_validator_writer(
    rowid INTEGER,
	b_id INTEGER,	
    b_name VARCHAR,
    b_addr VARCHAR,
    b_info jsonb,
    e_by VARCHAR,
    e_id INTEGER
)
RETURNS TABLE (row_id INTEGER, status INTEGER, msg registry.banks_msgs[],bank_name VARCHAR) AS $$
DECLARE
    bank_name VARCHAR := NULL;
    bevt registry.bevts := 'BANK_ONBOARDED';
	validator_result registry.banks_msgs[];
BEGIN
	
	validator_result :=  registry.bank_validator(b_name,b_id,b_addr,b_info);
	   
    IF array_length(validator_result, 1) > 0 THEN
		RETURN QUERY SELECT rowid,0,validator_result,bank_name;
		RETURN;
	END IF;

	CASE 
		WHEN b_id IS NULL THEN
    		INSERT INTO registry.banks (bname, baddr, bevt, binfo, eby, eid)
    		VALUES (b_name, b_addr, bevt, b_info, e_by, e_id)
   			RETURNING bname INTO bank_name ;

			INSERT INTO registry.orgs (oname,otype)
			VALUES (b_name,'BANK');
   			RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_INSERT']::registry.banks_msgs[],bank_name;
				
		WHEN b_id IS NOT NULL THEN 
    		UPDATE registry.banks
       		SET 
           		baddr = COALESCE(b_addr, baddr),
            	binfo = COALESCE(NULLIF(b_info::text, '{}'::text)::json, binfo),
				eby = e_by,
				eid = e_id,
				eat = CURRENT_TIMESTAMP
       		WHERE bid = b_id
			RETURNING bname INTO bank_name;
       		RETURN QUERY SELECT rowid, 1,  ARRAY['SUCCESS_UPDATE']::registry.banks_msgs[], bank_name;

	END CASE;


END;
$$ LANGUAGE plpgsql;