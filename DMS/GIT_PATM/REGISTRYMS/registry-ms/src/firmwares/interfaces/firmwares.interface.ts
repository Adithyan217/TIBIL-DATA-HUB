export interface firmware{
  
        event: string;
        event_by: string;
        eid: number;
        edetails:[
            {
              row_id: number;
              mfid: string;
              fname: string;
            }
          ]
    
    
}