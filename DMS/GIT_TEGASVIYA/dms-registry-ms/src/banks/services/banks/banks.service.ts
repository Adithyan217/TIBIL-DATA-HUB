import {HttpStatus , Inject , Injectable} from '@nestjs/common';
import {QueryService} from "../query/query.service";
import {Pool} from 'pg';
import {generateResponse, CODE, MESSAGE} from "../../../common/enum/common.enum";

@Injectable()
export class BanksService {

    constructor(private qs: QueryService,  @Inject('DATABASE_POOL') private readonly pool: Pool) {
    }

    public getBanksByUsers = async (body, req) => {
        try {
            const bankListStr = await  this.qs.getUserBanksList(body.email);
            const bankListResult = await this.pool.query(bankListStr.query, bankListStr.values);

            const availableBankStr = await this.qs.getUserBanksList(req.user.userName);
            const availableBankResult =  await this.pool.query(availableBankStr.query, availableBankStr.values);
            if(bankListResult.rowCount > 0) {
                return generateResponse(HttpStatus.OK, CODE.SUCCESS, [], {available_banks: availableBankResult.rows, selected_banks: bankListResult.rows} );

            }
            else
            {
                return generateResponse(HttpStatus.OK, CODE.SUCCESS, [] );
            }
        }
       catch(error) {
            return generateResponse(HttpStatus.INTERNAL_SERVER_ERROR, CODE.ERROR, error.message);

       }
    }
}
