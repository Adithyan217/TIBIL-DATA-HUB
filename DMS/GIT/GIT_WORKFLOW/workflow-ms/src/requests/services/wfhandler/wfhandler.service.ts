/* eslint-disable indent */
/* eslint-disable no-console */
/* eslint-disable no-unsafe-optional-chaining */
import { HttpService } from "@nestjs/axios";
import { Inject, Injectable } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { Hinfo } from "src/requests/interfaces/request.dto";
import { queryService } from "../query/query.service";
import { Pool } from "pg";
import { currentTimestamp } from "../utils/date";
import { handler_message } from "../enum/handler_message.enum";

@Injectable()
export class wfHandlerService {
  constructor(
    @Inject("DATABASE_POOL") private readonly pool: Pool,
    private http: HttpService,
    private qs: queryService,
  ) {}

  async eventProcessor(event: Hinfo) {
    try {
      const fetchHandler = await this.qs.getHandlers();
      const result = await this.pool.query(fetchHandler, [event?.ecode]);
      if (result?.rows?.length > 0) {
        const steps = result?.rows;
        this.executeSteps(event, steps);
        return { code: 200, message: "Hanlder is processing" };
      } else {
        await this.updateWfActionLogForEvent("FAILURE", event?.alid);
        return { code: 400, error: "Unable to find the handler" };
      }
    } catch (error) {
      await this.updateWfActionLogForEvent("FAILURE", event?.alid);
      return { code: 400, error: "Unable to find the handler" };
    }
  }

  async executeSteps(
    event: Hinfo,
    steps: Array<{ sid: number; hinfo: Array<{ endpoint: string }> }>,
  ) {
    try {
      for (const step of steps) {
        for (const item of step?.hinfo) {
          const reqUrl = process.env.REGISTRY_URL + item?.endpoint;
          const createStepLog = await this.qs.createStepLog();
          const result = await this.pool.query(createStepLog, [
            step.sid,
            event.aid,
            event.eid,
            "PROCESSING",
            currentTimestamp(),
          ]);
          if (result?.rows?.length > 0) {
            const slid = result?.rows[0]?.lid;
            let body ={
              eid: event?.eid,
              event: event?.ecode,
              event_by: event?.eby,
              edetails: event?.edetails,
            }

            const response = await lastValueFrom(
              this.http.post(reqUrl, body, {
                validateStatus: function (status) {
                  return status < 500; // Resolve only if the status code is less than 500
                },
              }),
            );

            if (response?.status === 200 || response?.status === 201) {
              console.log(
                "Entering updation of handler process",
                JSON.stringify(response?.data?.edata),
              );
              await this.updateStepLogForHandler(
                "PROCESSED",
                slid,
                `[${JSON.stringify(response?.data?.edata)}]`,
              );
              await this.updateWfActionLogForEvent("PROCESSED", event?.alid);
            } else if (response?.status === 400) {
              console.log("Response from registry is::::", response.status);
              await this.updateStepLogForHandler(
                "FAILURE",
                slid,
                `[{"status": ${JSON.stringify(response?.data)}}]`,
              );
              await this.updateWfActionLogForEvent("FAILURE", event?.alid);
            } else {
              console.log(
                "Unhandled response status from registry:",
                response.status,
                response.data,
              );
              await this.updateStepLogForHandler(
                "FAILURE",
                slid,
                `[{"status": ${JSON.stringify(response?.data)}}]`,
              );
              await this.updateWfActionLogForEvent("FAILURE", event?.alid); // Or handle differently if needed
            }
          }
        }
      }
    } catch (error) {
      console.error("Error occurred in Handler Service:::", error);
      this.updateWfActionLogForEvent("FAILURE", event?.alid);
      return { code: 400, message: "Unable to invoke steps" };
    }
  }

  async updateWfActionLogForEvent(status, lid) {
    const query = await this.qs.updateWfaLog();
    const res = await this.pool.query(query, [status, currentTimestamp(), lid]);
  }

  async updateStepLogForHandler(status, lid, log_details?: any) {
    const query =
      log_details === undefined
        ? await this.qs.updateStepLog()
        : await this.qs.updateStepLog(true);
    const res =
      log_details === undefined
        ? await this.pool.query(query, [status, currentTimestamp(), lid])
        : await this.pool.query(query, [
            status,
            currentTimestamp(),
            log_details,
            lid,
          ]);
  }

  async getHandlerStatusExecution(aid: number, eid: number) {
    try {
      const query = await this.qs.getHandlerStatusQuery();
      const result = await this.pool.query(query, [aid, eid]);
      if (result.rowCount && result.rowCount > 0) {
        return {
          code: handler_message.SUCCESS_CODE,
          data: result.rows,
        };
      } else {
        return {
          code: handler_message.FAILURE_CODE,
          message: handler_message.NO_RECORDS,
        };
      }
    } catch (e) {
      return {
        code: handler_message.ERROR_CODE,
        message: e.message,
      };
    }
  }
}
