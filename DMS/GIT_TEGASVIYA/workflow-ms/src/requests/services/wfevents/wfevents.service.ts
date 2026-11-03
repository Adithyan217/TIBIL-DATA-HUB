/* eslint-disable no-console */
import { Inject, Injectable } from "@nestjs/common";
import { Wrequest } from "src/requests/interfaces/request.dto";
import { SchemaValidationService } from "../utils/validator.service";
import { queryService } from "../query/query.service";
import { Pool } from "pg";
import { HttpService } from "@nestjs/axios";
import {generate , lastValueFrom} from "rxjs";
import { event_message } from "../enum/event_messages.enum";
import {WinstonLoggerService} from "../winstonlogger/winstonlogger.service";
import {generateResponse, CODE, MESSAGE} from "../enum/common_messages.enum";

@Injectable()
export class wfEventsService {
  constructor(
    @Inject("DATABASE_POOL") private readonly pool: Pool,
    private validationService: SchemaValidationService,
    private qs: queryService,
    private http: HttpService,
    protected wl:WinstonLoggerService
  ) {}
  public async addRequests(details: Wrequest, token: string) {
    try {
      const schema = await this.validationService.loadSchemaIfPresent(
        details?.event,
      );
      if (!schema) {

        return generateResponse(200, CODE.INVALID, MESSAGE.INVALID_SCHEMA );
      }
      const validate = await this.validationService.ajvValidator(
        schema,
        details,
      );
      if (validate?.errors) {
        return generateResponse(200, CODE.INVALID, [], {message: MESSAGE.INVALID_SCHEMA, errors: validate?.errors} );
      }
      const query = await this.qs.addReq();
      const result = await this.pool.query(query, [
        details?.event_by,
        details,
        details?.event,
        "NEW",
      ]);
      if (result?.rows) {
        const eid = result?.rows[0]?.eid;
        this.callAgentApi(result?.rows[0]?.eid, token);
        return generateResponse(200, CODE.SUCCESS, [], {event_id: eid, message: MESSAGE.SUCCESS});

      } else {
        return generateResponse(400, CODE.ERROR, MESSAGE.ERROR);
      }
    } catch (error) {
      this.wl.error("error for wfevents", error)
      return generateResponse(400, CODE.ERROR, error.message);
    }
  }

  async callAgentApi(eid, token) {
    try {
      const url = process.env["AXIOS-URL"] + "/requests/wfagent";
      const body = {
        event_id: eid,
      };
      const response = await lastValueFrom(this.http.post(url, body, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }));
      this.wl.log(`Response is:::, ${response.status}`);
    } catch (error) {
      this.wl.error("The error is:::", error);
    }
  }

  async getEventLogsExecution(data) {
    try {
      const querystr = await this.qs.getEventLogsQuery(true,data);
      const count = await this.pool.query(querystr.query, querystr.values);
      if (count.rows[0].count > 0) {
        const querystr = await this.qs.getEventLogsQuery(false,data);
        const result = await this.pool.query(querystr.query, querystr.values);

        return generateResponse(200, CODE.SUCCESS, result.rows, {count:count.rows[0].count });
      } else  {
        return generateResponse(200, CODE.SUCCESS,[]);
      }
    } catch (e) {
      return generateResponse(400, CODE.ERROR, e.message);

    }
  }


  async getEventHistory(request_id) {
    try {
      const query = await this.qs.eventHistory();
      this.wl.log(request_id)
      const result = await this.pool.query(query, [request_id]);
      return generateResponse(200, CODE.SUCCESS, result?.rows?.length > 0? result?.rows : [])

    } catch (error) {
      return generateResponse(400, CODE.ERROR, error.message);
    }
  }
}
