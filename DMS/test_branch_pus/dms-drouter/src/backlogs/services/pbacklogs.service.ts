import {HttpStatus , Inject , Injectable} from '@nestjs/common';
import {Pool} from 'pg';
import {getBacklogsQuery } from '../queries/pBacklog.query';
import { PnotifService } from '../../dms/services/pnotif/pnotif.service'
@Injectable()
export class PbacklogsService {

    constructor(@Inject('DATABASE_POOL') private readonly pool: Pool, private pnotif: PnotifService) {}


    reTransactPayment = async () => {
        try{
                const {queryStr, values} = await getBacklogsQuery();
                const backlogsResult = await this.pool.query(queryStr, values);
                if (backlogsResult.rowCount > 0) {
                   for (const el of backlogsResult.rows){
                       await this.pnotif.transformAndPushMqtt(el.rcontext, el.details, el.pid, el.imei, el.rtcount+1);
                   }
                    return {
                        satus: HttpStatus.OK,
                        data: {
                            code: 2000,
                            message: "Processed Successfully"
                        }
                    }
                }



        }
        catch (e) {
            return {
                satus: HttpStatus.INTERNAL_SERVER_ERROR,
                data: {
                    code: 5000,
                    message: e.message
                }
            }
        }
    }
}
