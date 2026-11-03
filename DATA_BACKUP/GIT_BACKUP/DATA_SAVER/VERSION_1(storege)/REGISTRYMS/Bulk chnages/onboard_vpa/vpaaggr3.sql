CREATE OR REPLACE FUNCTION registry.onboard_vpa_2(
    rowid INT[],
    vpa_name TEXT[],
    d_name TEXT[],
    b_name TEXT[],
    event_bys TEXT[],
    eids INT[]
)
RETURNS TABLE (onboard_vpa JSONB,bind_device JSONB) AS
$$
DECLARE
BEGIN

	RETURN QUERY SELECT 

    (SELECT jsonb_agg(v) FROM registry.vpa_iterator(
        rowid,
        vpa_name,
        d_name,
        b_name,
        event_bys,
        eids
    ) v) AS onboard_vpa,

    (SELECT jsonb_agg(s) FROM registry.sb_iterator(
        rowid,
        'BIND_DEVICE',
        vpa_name,    
        d_name,
        ARRAY[]::TEXT[],
        ARRAY[]::TEXT[],
        ARRAY[]::TEXT[],
        event_bys,
        eids
    ) s) AS bind_device;

    
END;
$$ LANGUAGE plpgsql;



SELECT * FROM registry.onboard_vpa_2(
	ARRAY[1,2],
    ARRAY['vpa10', 'vpa11'],  
	ARRAY['device_al123','device_3334'],
	ARRAY['bank_1', 'bank_1'], 
    ARRAY['ui1', 'ip1'], 
    ARRAY[28, 28]
);













----------------------------------RESULTS


"onboard_vpa"	"bind_device"
"[{""msg"": [""VPA_REPEATED""], ""vid"": ""vpa10"", ""row_id"": 1, ""status"": 0}, {""msg"": [""INVALID_DEVICE""], ""vid"": ""vpa11"", ""row_id"": 2, ""status"": 0}]"	"[{""eat"": null, ""msgs"": [""SUCCESS""], ""row_id"": 1, ""status"": 1, ""id_values"": [null, null, null, null, null], ""id_headers"": [""device_id"", ""vpa_id"", ""bank_id"", ""branch_id"", ""merchant_id""]}, {""eat"": null, ""msgs"": [""INVALID_DEVICE"", ""INVALID_VPA""], ""row_id"": 2, ""status"": 0, ""id_values"": [], ""id_headers"": []}]"