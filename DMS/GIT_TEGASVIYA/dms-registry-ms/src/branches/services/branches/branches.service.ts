import {HttpStatus , Inject , Injectable} from '@nestjs/common';
import {CODE , generateResponse} from "../../../common/enum/common.enum";
import {QueryService} from "../query/query.service";
import {Pool} from 'pg';
@Injectable()
export class BranchesService {

    constructor(private qs: QueryService,  @Inject('DATABASE_POOL') private readonly pool: Pool) {}

    public getBranchesByUsers = async (body, req) => {
        try {
            const branchListStr = await  this.qs.getUserBranchesList(body.email, 'BRANCH', body.bid);
            const branchListResult = await this.pool.query(branchListStr.query, branchListStr.values);

            const availableBranchStr = await this.qs.getUserBranchesList(req.user.userName, 'BRANCH', body.bid);
            const availableBranchResult =  await this.pool.query(availableBranchStr.query, availableBranchStr.values);
            if(branchListResult.rowCount > 0 || availableBranchResult.rowCount> 0 ) {
                return generateResponse(HttpStatus.OK, CODE.SUCCESS, [], {available_branches: availableBranchResult.rows, selected_branches: branchListResult.rows} );
            }
            else
            {
                return generateResponse(HttpStatus.OK, CODE.SUCCESS, []);
            }
        }
        catch(error) {
            return generateResponse(HttpStatus.INTERNAL_SERVER_ERROR, CODE.ERROR, error.message);
        }
    }
}
