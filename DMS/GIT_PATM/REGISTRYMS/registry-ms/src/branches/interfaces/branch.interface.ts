export interface Branch{
    
        event: string;
        event_by: string;
        eid: number;
        edetails: [{
            row_id: number;
            branch_id?: number;
            bank_id?: string;
            branch_name?: string;
            braddr?: string;
            brinfo?: {
                name: string;
                designation: string;
                phno: string;
                email: string;
            };
        }]
    
  
}

