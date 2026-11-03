export interface Devices {
    event: string;
    event_by: string;
    eid: number;
    edetails: Array<{ // Change from tuple to array
        row_id: number;
        dtype?: string,
        onboard_status?: string;
        device_id?: number;
        imei?: string;
        mf_id?: string;
        model_id?: string;
        firmware_id?: string;
        sbe?: boolean;
        dname?: string;
        vpa_id?: string;
        bank_id?: string;
        branch_id?: string;
        merchant_id?: string;
    }>;
}

export interface msbDevices {
    event: string;
    event_by: string;
    eid: number;
    edetails: Array<{ // Change from tuple to array
        row_id: number;
        dtype?: string;
        bank_id?: string;
        branch_id?: string;
        merchant_id?: string;
        phno?:string;
    }>;
}

export interface DevicePaymentInfo{
    pagination:{
        limit: number;
        offset: number;
    }
    filter:{
        device_id: string;
        from_date: string;
        to_date: string;
    }
}