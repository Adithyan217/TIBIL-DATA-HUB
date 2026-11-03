
const getBacklogsQuery = async () => {
    const query: string = `SELECT pc.pid,  pc.dname, rtcount, imei, rcontext, details 
                           FROM drouter.payments_cache pc
                           LEFT JOIN drouter.soundboxes s ON s.dname =  pc.dname
                           WHERE status <> 'SENT_REQUEST_TO_MQTT' AND status <> 'DEACTIVATED_DEVICE' AND rtcount <= 3
    `;
    return {queryStr: query, values: []};
}


export    {
getBacklogsQuery
}