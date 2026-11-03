import { Injectable } from '@nestjs/common';


@Injectable()
export class DeviceQueryService {

    public async deviceDeactivationQuery(dname){
        const values = [dname]
        const query = `INSERT INTO drouter.deactivated_list (dname) 
                        VALUES($1) 
                        ON CONFLICT DO NOTHING RETURNING dlid`;
            return{query: query, values: values};
    }

    public insertIntoSoundBox(dname, imei, rcontext){
        const values = [dname, imei, rcontext];
        const query = `INSERT INTO drouter.soundboxes  (dname, imei, rcontext) VALUES($1, $2, $3)ON CONFLICT DO NOTHING RETURNING did`;
        return {query: query, values: values};

    }


}