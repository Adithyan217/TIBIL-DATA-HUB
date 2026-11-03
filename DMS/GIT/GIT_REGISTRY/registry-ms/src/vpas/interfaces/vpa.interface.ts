export interface vpa{
   
        event: string,
        event_by: string,
        eid: number;
        edetails:[
            {
              row_id: number;
              vpa: string;
              bank_id: string;
              device_id: string;
            }
          ]
    
    
}