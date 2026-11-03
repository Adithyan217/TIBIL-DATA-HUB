import { Injectable } from '@nestjs/common';

@Injectable()
export class QueryService {
    constructor() {}

    async validateAndInsertSimRequest() {
        const query = "SELECT * FROM registry.sim_request($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ";
        return query;
    }
}
