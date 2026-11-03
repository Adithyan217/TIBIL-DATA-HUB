export interface model{
 
        event: string;
        event_by: string;
        eid: number;
        edetails:[
            {
              row_id: number;
              mfid: string;
              firmware_id: string;
              model_name: string;
            }
          ]
    
    
}