export interface DeviceRequest{
        event: string;
        event_by: string;
        eid: number;
        edetails: Array<{
            row_id: number;
            context?: string;
            drid?: number;
            bank_name?: string;
            bank_id?: number;
            branch_name?: string;
            merchant_name?: string;
            sim_provider?: string;
            device_quantity?: number;
            status?: string;
        }>
    
    
}

