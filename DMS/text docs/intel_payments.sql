CREATE TABLE intel.intel_payments (
    pid SERIAL PRIMARY KEY,
    bid INTEGER NOT NULL,
    brid INTEGER NOT NULL,
    pcount INTEGER NOT NULL,
    ptotal NUMERIC(15,2) NOT NULL,
    eat TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE intel.intel_payements_v RENAME TO intel_payments_v

CREATE TABLE intel.intel_payements_v (
    id SERIAL PRIMARY KEY,
    bid INTEGER NOT NULL,
    brid INTEGER NOT NULL,
    pcount INTEGER NOT NULL,
    ptotal NUMERIC(15,2) NOT NULL,
    eat TIMESTAMP NOT NULL DEFAULT now(),
    op TEXT NOT NULL CHECK (op IN ('insert', 'update'))
);

CREATE OR REPLACE FUNCTION intel.log_payment_change()
RETURNS TRIGGER AS $$
DECLARE
    change_pcount INTEGER;
    change_ptotal NUMERIC(15,2);
    op_type TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        change_pcount := NEW.pcount;
        change_ptotal := NEW.ptotal;
        op_type := 'insert';

    ELSIF TG_OP = 'UPDATE' THEN
        change_pcount := NEW.pcount - OLD.pcount;
        change_ptotal := NEW.ptotal - OLD.ptotal;

        IF change_pcount = 0 AND change_ptotal = 0 THEN
            RETURN NEW;
        END IF;

        op_type := 'update';
    END IF;

    INSERT INTO intel.intel_payments_v (
        bid, brid, pcount, ptotal, eat, op
    ) VALUES (
        NEW.bid, NEW.brid, change_pcount, change_ptotal, now(), op_type
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_log_payment_change
AFTER INSERT OR UPDATE ON intel.intel_payments
FOR EACH ROW
EXECUTE FUNCTION intel.log_payment_change();


INSERT INTO intel.intel_payments (bid, brid, pcount, ptotal)
VALUES (1, 1, 1, 1500.00);

INSERT INTO intel.intel_payments (bid, brid, pcount, ptotal)
VALUES (1, 3, 1, 1000.00);

UPDATE intel.intel_payments SET pcount = pcount+1 , ptotal = ptotal + 100 WHERE bid = 1 and brid = 3

select * from intel.intel_payments_v


SELECT
    SUM(pcount) AS total_payment_count,
    SUM(ptotal) AS total_payment_amount
FROM intel.intel_payments_v
WHERE bid = ANY(ARRAY[1])
  AND brid =ANY(ARRAY[1,2])
  AND eat BETWEEN '2025-06-10' AND '2025-06-20';


SELECT
	bid,brid,
    SUM(pcount) AS total_payment_count,
    SUM(ptotal) AS total_payment_amount
FROM intel.intel_payments_v
WHERE 
   eat BETWEEN '2025-06-10' AND '2025-06-20'
GROUP BY (bid,brid)