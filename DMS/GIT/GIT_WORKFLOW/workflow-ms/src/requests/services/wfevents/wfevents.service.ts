/* eslint-disable no-console */
import { Inject, Injectable } from "@nestjs/common";
import { Wrequest } from "src/requests/interfaces/request.dto";
import { SchemaValidationService } from "../utils/validator.service";
import { queryService } from "../query/query.service";
import { Pool } from "pg";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { event_message } from "../enum/event_messages.enum";
@Injectable()
export class wfEventsService {
  constructor(
    @Inject("DATABASE_POOL") private readonly pool: Pool,
    private validationService: SchemaValidationService,
    private qs: queryService,
    private http: HttpService,
  ) {}
  public async addRequests(details: Wrequest) {
    try {
      const schema = await this.validationService.loadSchemaIfPresent(
        details?.event,
      );
      if (!schema) {
        return { code: 400, message: "No schema present for the request" };
      }
      const validate = await this.validationService.ajvValidator(
        schema,
        details,
      );
      if (validate?.errors) {
        return {
          code: 400,
          message: "Schema Validation Failed",
          errors: validate?.errors,
        };
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
        this.callAgentApi(result?.rows[0]?.eid);
        return {
          code: 200,
          event_id: eid,
          message: "Request added successfully",
        };
      } else {
        return {
          code: 400,
          message: "Unable to process your request. Please try again later.",
        };
      }
    } catch (error) {
      console.error("error for wfevents", error)
      return { code: 400, error: "BAD_REQUEST" };
    }
  }

  async callAgentApi(eid) {
    try {
      const url = process.env.AXIOS_URL + "/requests/wfagent";
      const body = {
        event_id: eid,
      };
      const response = await lastValueFrom(this.http.post(url, body));
      console.log("Response is:::", response.status);
    } catch (error) {
      console.error("The error is:::", error);
    }
  }

  async getEventLogsExecution(data) {
    try {
      const querystr = await this.qs.getEventLogsQuery(true,data);
      const count = await this.pool.query(querystr.query, querystr.values);
      if (count.rows[0].count > 0) {
        const querystr = await this.qs.getEventLogsQuery(false,data);
        const result = await this.pool.query(querystr.query, querystr.values);

        return {
          code: event_message.SUCCESS_CODE,
          count: count.rows[0].count,
          data: result.rows,
        };
      } else {
        return {
          code: event_message.FAILURE_CODE,
          message: event_message.NO_RECORDS,
        };
      }
    } catch (e) {
      return {
        code: event_message.ERROR_CODE,
        message: e.message,
      };
    }
  }
}
