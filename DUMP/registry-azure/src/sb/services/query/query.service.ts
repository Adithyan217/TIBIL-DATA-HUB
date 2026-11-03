import { Injectable } from '@nestjs/common';
import { sb } from 'src/sb/interfaces/sb.interface';

@Injectable()
export class QueryService {
    constructor(){

    }

    async validateAndInsertSb(){
        const query = "select row_id,status,msgs AS msg,id_headers,id_values,eat,bid,brid,last_action from registry.sb_iterator($1::integer[],$2,$3::text[],$4::text[],$5::text[],$6::text[],$7::text[],$8::TEXT[],$9::integer[])"
        return query
    }


    async validateAndConnectSb(){
        const query = "select * from registry.pair_device_iterator($1, $2, $3)"
        return query
    }

}
