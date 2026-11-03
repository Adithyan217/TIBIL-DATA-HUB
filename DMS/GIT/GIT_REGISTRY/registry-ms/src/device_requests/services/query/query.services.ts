import { Injectable } from '@nestjs/common';

@Injectable()
export class QueryService {
    constructor() {}

    async validateAndInsertDeviceRequest() {
        const query = "SELECT * FROM registry.request_for_device($1,$2,$3,$4,$5,$6,$7,$8,$9) ";
        return query;
    }

   

}
