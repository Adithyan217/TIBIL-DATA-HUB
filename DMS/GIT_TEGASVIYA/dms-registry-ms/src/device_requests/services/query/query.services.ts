import { Injectable } from '@nestjs/common';

@Injectable()
export class QueryService {
    constructor() {}

    async validateAndInsertDeviceRequest() {
        const query = "SELECT * FROM registry.device_request_iterator($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ";
        return query;
    }

   

}
