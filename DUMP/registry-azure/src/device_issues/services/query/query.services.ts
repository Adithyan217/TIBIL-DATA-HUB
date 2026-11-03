import { Injectable } from '@nestjs/common';

@Injectable()
export class QueryService {
    constructor() {}

    async validateAndInsertDeviceIssue() {
        const query = "SELECT * FROM registry.raise_device_issues($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ";
        return query;
    }

   

}
