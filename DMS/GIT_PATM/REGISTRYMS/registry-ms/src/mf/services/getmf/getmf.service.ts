import {HttpStatus , Inject , Injectable} from '@nestjs/common';
import { Pool } from 'pg';
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";
import {QueryService } from '../query/query.service'
import {CODE , generateResponse} from "../../../common/enum/common.enum";
@Injectable()
export class GetmfService {
    constructor(@Inject('DATABASE_POOL') private readonly pool: Pool, private wl: WinstonLoggerService, private qs: QueryService) {}

    async getMfLanguages(body){
        try{
            const {query, values} = await this.qs.getMfLanguges(body.mfid);
            const result = await this.pool.query(query, values);
            if (result.rows.length > 0) {
                return generateResponse(HttpStatus.OK, CODE.SUCCESS, result.rows);

            }
            return generateResponse(HttpStatus.OK, CODE.SUCCESS,[]);

        }catch (e) {
            this.wl.error(`getmf languages error: ${e.message}`);
            return generateResponse(HttpStatus.INTERNAL_SERVER_ERROR, CODE.SUCCESS,[]);
        }
    }


}
