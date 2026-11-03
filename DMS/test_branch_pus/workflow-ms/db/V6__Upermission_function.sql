ALTER TABLE workflow.upermissions ADD COLUMN fname VARCHAR;
ALTER TABLE workflow.upermissions ADD COLUMN lname VARCHAR;
ALTER TABLE workflow.upermissions ADD COLUMN isd BOOLEAN DEFAULT false;

ALTER TABLE workflow.upermissions
ADD CONSTRAINT upermissions_unique_user_context
UNIQUE (username, context, context_id);

CREATE INDEX IF NOT EXISTS idx_upermissions_username_contex_context_id
ON workflow.upermissions(username,context,context_id);

DROP FUNCTION IF EXISTS workflow.add_user_permissions;

CREATE OR REPLACE FUNCTION workflow.add_user_permissions(
    p_username TEXT,
    p_context workflow.ucontexts[], 
    p_context_id INTEGER[],
    p_action TEXT[],  -- 'ALLOW' or 'DENY'
    f_name TEXT,
    l_name TEXT
)
RETURNS TABLE(
    r_username VARCHAR, 
    r_context workflow.ucontexts, 
    r_context_id INTEGER,
    r_fname VARCHAR,
    r_lname VARCHAR,
    r_action TEXT
) AS $$
BEGIN
    FOR i IN 1..COALESCE(array_length(p_context, 1), 0) LOOP
        IF p_action[i] = 'ALLOW' THEN

            RETURN QUERY
            INSERT INTO workflow.upermissions AS u (username, context, context_id, fname, lname)
            VALUES (p_username, p_context[i], p_context_id[i], f_name, l_name)
			ON CONFLICT(username, context, context_id) 
			DO UPDATE SET isd = FALSE
			RETURNING u.username, u.context, u.context_id, u.fname, u.lname, 'ALLOW'::TEXT;

        ELSIF p_action[i] = 'DENY' THEN
            -- Set isd = true for deny
            RETURN QUERY
            UPDATE workflow.upermissions AS u
            SET isd = true
            WHERE u.username = p_username AND u.context = p_context[i] AND u.context_id = p_context_id[i]
            RETURNING u.username, u.context, u.context_id, u.fname, u.lname, 'DENY'::TEXT;

        ELSE
            RAISE EXCEPTION 'Invalid action value at position %: % (expected ALLOW or DENY)', i, p_action[i];
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;







----------------------------------------WFTABLES CHANGES---------------------------


INSERT INTO workflow.wfactions (ecode, ainfo, htype, isvisible, category, vcode, ischainable) VALUES
('SIM_REQUEST_DELIVERED', '{"endpoint":"/requests/wfhandler"}', 'api', true, 'sim_actions', NULL, false),
('SIM_REQUEST_DISPATCHED', '{"endpoint":"/requests/wfhandler"}', 'api', true, 'sim_actions', NULL, false),
('SIM_REQUEST', '{"endpoint":"/requests/wfhandler"}', 'api', true, 'sim_actions', 'Sim Request', true),
('SIMULATE_PAYMENT', '{"endpoint":"/requests/wfhandler"}', 'api', true, 'device_actions', 'Simulate Payment', false);


INSERT INTO workflow.wfhsteps (ecode, hinfo) VALUES
('SIM_REQUEST', '[{"endpoint":"/registry/sim-requests","sname":"Sim Request","method":"post"}]'),
('SIM_REQUEST_DISPATCHED', '[{"endpoint":"/registry/sim-requests","sname":"Sim Request Dispatched","method":"post"}]'),
('SIM_REQUEST_DELIVERED', '[{"endpoint":"/registry/sim-requests","sname":"Sim Request Delivered","method":"post"}]'),
('SIMULATE_PAYMENT', '[{"endpoint":"/registry/devices/transactions/simulate","sname":"Simulate Payment","method":"post"}]');

ALTER TABLE workflow.echain ADD COLUMN final_status BOOLEAN DEFAULT false;


INSERT INTO workflow.echain (pecode, eorder, cecode, final_status) VALUES
('SIM_REQUEST', 1, 'SIM_REQUEST_DISPATCHED', false),
('SIM_REQUEST', 1, 'SIM_REQUEST_DELIVERED', true);

UPDATE workflow.echain SET final_status = TRUE WHERE cecode IN ('DEVICE_REQUEST_DELIVERED','DEVICE_ISSUE_UPDATE');



UPDATE workflow.wfhsteps SET hinfo = '[{"endpoint":"/registry/devices","sname":"Update Device","method":"patch"}]' WHERE ecode = 'UPDATE_DEVICE'