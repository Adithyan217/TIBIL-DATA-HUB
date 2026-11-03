export interface DeviceRequest{
        event: string;
        event_by: string;
        eid: number;
        edetails: [{
            context?: string;
            drid?: number;
            bank?: string;
            branch?: string;
            merchant?: string;
            minfo?: {
                accName: string;
                accHolderName: string;
                phno: number;
              };
            status?: string;
        }]
    
    
}

