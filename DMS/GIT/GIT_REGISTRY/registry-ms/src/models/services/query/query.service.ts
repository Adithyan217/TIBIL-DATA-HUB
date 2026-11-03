import { Injectable } from '@nestjs/common';
import { model } from 'src/models/interfaces/model.interface';

@Injectable()
export class QueryService {
    constructor(){

    }

    async validateAndInsertModel(){
        const query = "select row_id,status,msg,mdid from registry.model_iterator($1,$2,$3,$4,$5,$6)"
        return query
    }

    
}
