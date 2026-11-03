export interface SimRequest {
    event: string;
    event_by: string;
    eid: number;
    edetails: [{
        row_id?: number;
        context?: string;
        srid?: number;
        device?: string;
        bank_name?: string;
        bank_id?: number;
        branch?: string;
        merchant?: string;
        status?: string;
        current_sp?: string;
        requested_sp?: string;
    }];
}
