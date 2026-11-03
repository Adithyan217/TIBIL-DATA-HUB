export interface Merchant{
        event: string;
        event_by: string;
        eid: number;
        edetails:[
            {
              row_id: number;
              merchant_id?: number;
              bank_id?: string;
              branch_id?: string;
              mname?: string;
              maddr?: string;
              msid?: number;
              minfo?: {
                accName: string;
                accHolderName: string;
                phno: number;
              }
            }
          ]
    
    
}