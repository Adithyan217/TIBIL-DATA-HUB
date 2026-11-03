export interface Bank{
    
       event: string;
        event_by: string;
        eid: number;
        edetails:[{
            row_id:number;
            bank_id?: number;
            bank_name?: string;
            baddr?: string;
            binfo?:{
                name: string;
                phno: number;
                email: string;
                designation: string;
            }
        }]

}