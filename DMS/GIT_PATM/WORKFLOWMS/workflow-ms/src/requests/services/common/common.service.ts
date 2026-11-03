import { HttpService } from "@nestjs/axios";
import { Inject, Injectable } from "@nestjs/common";
import { queryService } from "../query/query.service";
import Pool from "pg";
import {user_permissions , message , generateResponse , CODE , MESSAGE} from "../enum/common_messages.enum";
import {WinstonLoggerService} from "../winstonlogger/winstonlogger.service";
import {generate} from "rxjs";
@Injectable()
export class commonService {
  constructor(
    @Inject("DATABASE_POOL") private readonly pool: Pool,
    private qs: queryService,
    private http: HttpService,
    protected wl: WinstonLoggerService
  ) {}

//   async addUserPermissions(body){
//     try{
//         const queryStr = await this.qs.upermissions(body);
//         const result = await this.pool.query(queryStr.query, queryStr.values);
//         if(result.rowCount > 0){
//             return {
//                 code: user_permissions.SUCCESS_CODE,
//                 data: result.rows
//             }
//         }
//         else {
//             return {
//                 code: user_permissions.FAILURE_CODE,
//                 message: user_permissions.FAILURE_MESSAGE
//             }
//         }

//     }catch (e) {
//         return {
//             code: user_permissions.ERROR_CODE,
//             message: e.message
//         }

//     }      
// }

async addUserPermissions(body) {
  try {
      let transformedData = await this.transformToUpermissionSchema(body)
      let upermissionInsert = await this.qs.upermissions()
      let result = await this.pool.query(upermissionInsert, [
          transformedData.username,
          transformedData.context,
          transformedData.context_id,
          transformedData.action,
          transformedData.fname,
          transformedData.lname,
          transformedData.urole
          
      ]);

      if (result?.rows?.length > 0) {
        return generateResponse(200, CODE.SUCCESS, result?.rows);
      } else {
        return  generateResponse(200, CODE.INVALID, MESSAGE.FAILURE_TO_ADD_PERMISSION);
      }
  }
  catch (error) {
      this.wl.error("The error in onboarding::", error?.message)
      return generateResponse(400, CODE.ERROR, error.message);
  }
}

async transformToUpermissionSchema(body) {
  const context: (number | null)[] = [];
  const context_id: (number | null)[] = [];
  const action : (string | null)[] = [];
  const urole : (string | null)[] = [];

  const data = body?.data || null;
  const username = data[0].r_username || null;
  const fname = data[0].r_fname || null;
  const lname = data[0].r_lname || null;
  for (let items of data) {
      context.push(items.r_context)
      context_id.push(items.r_context_id)
      action.push(items.r_action)
      urole.push(items.r_urole)

  }
  return { context, context_id, username, fname, lname, action, urole};
}





}
