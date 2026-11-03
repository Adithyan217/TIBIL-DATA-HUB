import { HttpService } from "@nestjs/axios";
import { Inject, Injectable } from "@nestjs/common";
import { queryService } from "../query/query.service";
import {Pool} from "pg";
@Injectable()
export class WfhlogService {
  constructor(
    @Inject("DATABASE_POOL") private readonly pool: Pool,
    private http: HttpService,
    private qs: queryService,
  ) {}

  async getHandlerLogDetails(event_id: number) {
    try {
      const query = await this.qs.getHandlerLog();
      const result = await this.pool.query(query, [event_id]);
      if (result?.rows?.length > 0) {
        return { code: 200, message: result?.rows };
      } else {
        return {
          code: 400,
          error: "No handler log present for the given event_id",
        };
      }
    } catch (error) {
      return {
        code: 500,
        error: "Unable to access the handler log due to internal error",
      };
    }
  }
}
