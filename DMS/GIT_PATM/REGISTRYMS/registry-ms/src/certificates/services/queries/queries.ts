
const getAvailableCertificateCountAndMaxLimit = (mfname) => {
    const query = `SELECT mf.max_cert_limit, mf.generated_cert_count, mf.s3bkt, mf.mfid FROM registry.mf as mf
                   WHERE mf.mfname = $1 and mf.isd = false`;
    const values = [mfname];
    return {queryStr: query, values: values};
}

const checkCertExists = (mfname, deviceId) => {
    const query = `SELECT dc.did, mf.s3bkt, mf.mfid   FROM registry.device_cert as dc
                    LEFT JOIN registry.mf as mf on mf.mfid = dc.mfid AND mf.mfname = $1 and mf.isd = false 
                    WHERE dc.did = $2`;
    const values = [mfname, deviceId];
    return {queryStr: query, values: values};
}

const addDeviceCertificateReq = (mfid, did) => {
    const query = `
        INSERT INTO registry.device_cert (mfid, did)
        VALUES ($1, $2)
            ON CONFLICT (mfid, did)
        DO UPDATE SET eat = CURRENT_TIMESTAMP RETURNING dcid`;
    const values = [mfid, did];
    return { queryStr: query, values: values };
}

const updateGeneratedCount = (mfid) => {
    const query = `UPDATE registry.mf set generated_cert_count = generated_cert_count+1 WHERE mfid = $1`;
    const values = [mfid];
    return {queryStr: query, values: values};
}


export {
    getAvailableCertificateCountAndMaxLimit,
    checkCertExists,
    addDeviceCertificateReq,
    updateGeneratedCount,
}