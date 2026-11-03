export interface sb{
        eid: number;
        event: string,
        event_by: string,
        edetails:[{
            row_id: number,
            vpa_id?: string,
            device_id?: string,
            bank_id?: string,
            branch_id?: string,
            merchant_id?: string,
        }]
    
}

export interface sbcon{
    eid: number;
    event: string,
    event_by: string,
    edetails:[{
        row_id: number,
        identifier?: string,
        std?: string,
    }]
}