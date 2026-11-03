export interface DeviceIssue {
    event: string;
    event_by: string;
    eid: number;
    edetails: [{
        row_id?: number;
        context?: string;
        iid?: number;
        device?: string;
        vpa?: string;
        bank_name?: string;
        bank_id?: number;
        branch?: string;
        merchant?: string;
        mphno?: string;
        status?: string;
        issue?: string;
    }];
}
