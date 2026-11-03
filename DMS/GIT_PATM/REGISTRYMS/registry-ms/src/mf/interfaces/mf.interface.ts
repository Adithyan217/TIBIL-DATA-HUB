export interface mf{
        event: string,
        event_by: string,
        eid: number,
        edetails:[{
            row_id: number,
            mfid?: number,
            mfname?: string,
            mfaddr?: string,
            mfinfo?: {
                name: string,
                phno: string,
                email: string
            }
            certno?:number;
        }]
    
    
}