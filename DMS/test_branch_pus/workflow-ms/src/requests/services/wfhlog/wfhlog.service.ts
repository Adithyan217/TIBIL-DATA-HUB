import { HttpService } from "@nestjs/axios";
import { Inject, Injectable } from "@nestjs/common";
import { queryService } from "../query/query.service";
import Pool from "pg";
import {WinstonLoggerService} from "../winstonlogger/winstonlogger.service";
import {CODE , generateResponse} from "../enum/common_messages.enum";
@Injectable()
export class WfhlogService {
  constructor(
    @Inject("DATABASE_POOL") private readonly pool: Pool,
    private http: HttpService,
    private qs: queryService,
    protected wl:WinstonLoggerService
  ) {}

  async getHandlerLogDetails(event_id: number) {
    try {
      const query = await this.qs.getHandlerLog();
      const result = await this.pool.query(query, [event_id]);

      return generateResponse(200, CODE.SUCCESS, result?.rows?.length > 0? result.rows: []);

    } catch (error) {
      return generateResponse(400, CODE.ERROR, error.message);
    }
  }
}
