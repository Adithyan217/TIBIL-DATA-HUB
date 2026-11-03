export interface Devices{
    
    
        event: string;
        event_by: string;
        eid: number;
        edetails: [{
            row_id: number;
            device_id?: number;
            imei?: string;
            mfid?: string;
            model_id?: string;
            firmware_id?: string;
            dname?: string;
        }]
    
    
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
