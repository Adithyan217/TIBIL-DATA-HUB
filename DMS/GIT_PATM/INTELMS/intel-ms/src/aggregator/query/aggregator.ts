// Types and interfaces
interface FilterParams {
    username: string;
    role: string;
    bid?: string[];
    brid?: string[];
    fDate?: string;
    tDate?: string;
    dFrom?: string;
    dTo?: string;
    imei?: string;
}

interface PermissionConfig {
    context: string;
    idField: string;
}

interface QueryConfig {
    table: string;
    alias: string;
    selectFields: string;
    permissions: PermissionConfig[];
    dateField?: string;
    dateRangeField?: string;
    useViewTable?: boolean;
    viewTable?: string;
}

interface QueryResult {
    query: string;
    values: any[];
}

// Generic permission checker builder
const buildPermissionClauses = (username: string, permissions: PermissionConfig[], alias: string): string[] => {
    return permissions.map((permission, index) => `
        EXISTS (
            SELECT 1 FROM intel.upermissions p${index + 1}
            WHERE p${index + 1}.username = $1
              AND p${index + 1}.context = '${permission.context}'
              AND p${index + 1}.context_id = ${alias}.${permission.idField}
              AND p${index + 1}.isd = false
        )`.trim());
};

// Generic filter builder
const buildFilterClauses = (
    filter: FilterParams,
    alias: string,
    values: any[],
    config: QueryConfig
): string[] => {
    const whereClauses: string[] = [];

    // Add bid filter
    if (filter.bid && Array.isArray(filter.bid) && filter.bid.length > 0) {
        whereClauses.push(`${alias}.bid = ANY($${values.length + 1})`);
        values.push(filter.bid);
    }

    // Add brid filter
    if (filter.brid && Array.isArray(filter.brid) && filter.brid.length > 0) {
        whereClauses.push(`${alias}.brid = ANY($${values.length + 1})`);
        values.push(filter.brid);
    }

    // Add date range filter
    if (filter.fDate != null && filter.tDate != null) {
        const dateField = config.dateRangeField || config.dateField || 'eat';
        values.push(filter.fDate, filter.tDate);
        whereClauses.push(`${dateField} BETWEEN $${values.length - 1} AND $${values.length}`);
    }

    // Add imei filter
    if (filter.imei) {
        values.push(filter.imei);
        whereClauses.push(`${alias}.imei = $${values.length}`);
        
    }

    return whereClauses;
};

// Generic query builder
const buildGenericQuery = (filter: FilterParams, config: QueryConfig): QueryResult => {

    const values: any[] = [];
    const whereClauses: string[] = [];

    if (filter.role !== 'DMS Admin') {
        if(!filter.imei ){
            values.push(filter.username);
        }
    }

    // Add permission clauses
    const permissionClauses = buildPermissionClauses(filter.username, config.permissions, config.alias);
    whereClauses.push(...permissionClauses);

    // Add filter clauses
    const filterClauses = buildFilterClauses(filter, config.alias, values, config);
    whereClauses.push(...filterClauses);

    // Determine table to use
    let table = config.table;
    if (config.useViewTable && filter.fDate != null && filter.tDate != null && config.viewTable) {
        table = config.viewTable;
    }

    const whereSection = whereClauses.length > 0 
    ? `WHERE ${whereClauses.join(' AND ')}`
    : '';
  
    const queryStr = `
        SELECT ${config.selectFields}
        FROM ${table}
        ${whereSection}
    `.trim();
  

    return { query: queryStr, values };
};

// Aggregator processor
const aggregatorProcessor = (sub_functions: any, params: any): QueryResult => {
    const queryStr = `SELECT * FROM intel.aggregate_processor3 ($1, $2)`;
    const values = [sub_functions, params];
    return {
        query: queryStr,
        values: values
    };
}
const getConfigQry = () => {

    const queryStr = `SELECT config
                      FROM intel.metric_flow 
                      WHERE ecode = $1 AND isd = false`;

    return { query: queryStr};
};

// Payment insert query
const paymentInsertQuery = (bid: string, brid: string, imei: string, amt: number): QueryResult => {
    const queryStr = `
        INSERT INTO intel.m_payments_daily (bid, brid, eat, imei, pcount, ptotal)
        VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5)
        ON CONFLICT (bid, brid, eat, imei) 
        DO UPDATE SET
            pcount = m_payments_daily.pcount + 1,
            ptotal = m_payments_daily.ptotal + $5;
    `;
    return {
        query: queryStr,
        values: [bid, brid, imei, 1, amt]
    };
}


// Payment metrics query
const getPaymentMetricsQuery = (filter: FilterParams): QueryResult => {
    const config: QueryConfig = {
        table: 'intel.m_payments_daily p',
        alias: 'p',
        selectFields: 'COALESCE(SUM(pcount),0) AS pcount, COALESCE(SUM(ptotal),0) AS ptotal',
        permissions: filter.imei
            ? [] 
            :filter.role === 'DMS Admin'? []
            : [
                { context: 'BANK', idField: 'bid' },
                { context: 'BRANCH', idField: 'brid' }
              ],
        dateField: 'eat'
      };

  
    return buildGenericQuery(filter, config);
};

// Bank metrics query
const getBankMetricsQuery = (filter: FilterParams): QueryResult => {
    const config: QueryConfig = {
        table: 'intel.m_banks b',
        alias: 'b',
        selectFields: 'COALESCE(COUNT(bid),0) as bank_count',
        permissions:filter.role === 'DMS Admin'? [] :  [
            { context: 'BANK', idField: 'bid' },
        ]
    };

    return buildGenericQuery(filter, config);
};

// Branch metrics query
const getBranchMetricsQuery = (filter: FilterParams): QueryResult => {
    const config: QueryConfig = {
        table: 'intel.m_branches b',
        alias: 'b',
        selectFields: 'COALESCE(COUNT(brid),0) as branch_count',
        permissions:filter.role === 'DMS Admin'? [] :  [
            { context: 'BRANCH', idField: 'brid' }
        ]
    };

    return buildGenericQuery(filter, config);
};

// Merchant metrics query
const getMerchantMetricsQuery = (filter: FilterParams): QueryResult => {
    const config: QueryConfig = {
        table: 'intel.m_merchants m',
        alias: 'm',
        selectFields: 'COALESCE(SUM(mcount),0) as merchant_count',
        permissions:filter.role === 'DMS Admin'? [] :  [
            { context: 'BANK', idField: 'bid' },
            { context: 'BRANCH', idField: 'brid' }
        ]
    };

    return buildGenericQuery(filter, config);
};

// Device issues query
const getIssues = (filter: FilterParams): QueryResult => {
    const config: QueryConfig = {
        table: 'intel.m_device_issues d',
        alias: 'd',
        selectFields: 'COALESCE(SUM(opencount),0) AS open_count, COALESCE(SUM(closedcount),0) AS closed_count',
        permissions:filter.role === 'DMS Admin'? [] :  [
            { context: 'BANK', idField: 'bid' },
            { context: 'BRANCH', idField: 'brid' }
        ],
        dateRangeField: 'event_at',
        useViewTable: true,
        viewTable: 'intel.m_device_issues_v d'
    };

    return buildGenericQuery(filter, config);
};


// Device request metrics query
const getDeviceRequestMetrics = (filter: FilterParams): QueryResult => {
    const config: QueryConfig = {
        table: 'intel.m_device_request d',
        alias: 'd',
        selectFields: 'COALESCE(SUM(opencount),0) AS open_count, COALESCE(SUM(closedcount),0) AS closed_count',
        permissions:filter.role === 'DMS Admin'? [] :  [
            { context: 'BANK', idField: 'bid' },
            { context: 'BRANCH', idField: 'brid' }
        ],
        dateRangeField: 'event_at',
        useViewTable: true,
        viewTable: 'intel.m_device_requests_v d'
    };

    return buildGenericQuery(filter, config);
};

// Device metrics query (incomplete function from original)
const getDeviceMetricsQuery = (filter: FilterParams): QueryResult => {

    const config: QueryConfig = {
        table: 'intel.m_devices d',
        alias: 'd',
        selectFields: filter.role === 'DMS Admin'
        ? 'COALESCE(SUM(incount),0) as inventory, SUM(COALESCE(mdcount, 0) + COALESCE(brdcount, 0) + COALESCE(bdcount, 0)) AS allocated'
        : 'COALESCE(SUM(bdcount),0) as bank, COALESCE(SUM(brdcount),0) as branch, COALESCE(SUM(mdcount),0) as merchant',
        permissions:filter.role === 'DMS Admin'? [] :  [
            { context: 'BANK', idField: 'bid' },
            { context: 'BRANCH', idField: 'brid' }
        ],
        dateRangeField: 'event_at',
        useViewTable: true,
        viewTable: 'intel.m_device_v d'
    };

    return buildGenericQuery(filter, config);
};

// Export all functions
export {
    getConfigQry,
    paymentInsertQuery,
    getPaymentMetricsQuery,
    getBankMetricsQuery,
    getBranchMetricsQuery,
    getMerchantMetricsQuery,
    getIssues,
    getDeviceRequestMetrics,
    getDeviceMetricsQuery,
    aggregatorProcessor,

};