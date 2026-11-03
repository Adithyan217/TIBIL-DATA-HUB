import { HttpService } from "@nestjs/axios";
import { Inject, Injectable } from "@nestjs/common";
import { queryService } from "../query/query.service";
import {Pool} from "pg";
@Injectable()
export class WfalogService {
  constructor(
    @Inject("DATABASE_POOL") private readonly pool: Pool,
    private http: HttpService,
    private qs: queryService,
  ) {}

  async getActionLogDetails(event_id: number) {
    try {
      const query = await this.qs.getActionLog();
      const result = await this.pool.query(query, [event_id]);
      if (result?.rows?.length > 0) {
        return { code: 200, message: result?.rows };
      } else {
        return { code: 400, error: "No action present for the given event_id" };
      }
    } catch (error) {
      return {
        code: 500,
        error: "Unable to access the action log due to internal error",
      };
    }
  }

 

  toPascalCase(str) {
    return str
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async getActionTypes() {
    try {
      const queryStr = await this.qs.getActionType();
      const result = await this.pool.query(queryStr.query);

      if (result?.rows?.length > 0) {
        const transformedEcodes = result.rows.map(row => row.vcode);

        return { code: 200, count: result.rowCount, ecodes: transformedEcodes };
      } else {
        return { code: 400, error: "No action types present" };
      }
    } catch (error) {
      console.error("Database Error:", error);
      return {
        code: 500,
        error: "Unable to access the action types due to an internal error",
      };
    }
  }
}
  

