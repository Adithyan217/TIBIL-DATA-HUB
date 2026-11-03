import { HttpService } from "@nestjs/axios";
import { Inject, Injectable } from "@nestjs/common";
import { queryService } from "../query/query.service";
import Pool from "pg";
import {WinstonLoggerService} from "../winstonlogger/winstonlogger.service";
import {CODE , generateResponse} from "../enum/common_messages.enum";
@Injectable()
export class WfalogService {
  constructor(
    @Inject("DATABASE_POOL") private readonly pool: Pool,
    private http: HttpService,
    private qs: queryService,
    protected wl:WinstonLoggerService
  ) {}

  async getActionLogDetails(event_id: number) {
    try {
      const query = await this.qs.getActionLog();
      const result = await this.pool.query(query, [event_id]);
        return generateResponse(200, CODE.SUCCESS, result?.rows?.length > 0 ? result?.rows : []);

    } catch (error) {
      this.wl.error("Error during API call for getActionLogDetails::", error);
      return generateResponse(400, CODE.ERROR, error.message );
    }
  }

 

  
  async getActionTypes(role: string) {
    try {
      const queryStr = await this.qs.getActionType(role);
      const result = await this.pool.query(queryStr.query, queryStr.values);

      if (result?.rows?.length > 0) {
        const transformedEcodes = result.rows.map(row => row.vcode);

        return generateResponse(200, CODE.SUCCESS, [], {count: result.rowCount, ecodes: transformedEcodes });
      } else {
        return generateResponse(200, CODE.SUCCESS, []);
      }
    } catch (error) {
      this.wl.error("Database Error:", error);
      return  generateResponse(400, CODE.ERROR, error.message);
    }
  }
}
  

