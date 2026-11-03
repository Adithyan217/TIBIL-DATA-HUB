/* eslint-disable no-console */
import { Inject, Injectable } from "@nestjs/common";
import { queryService } from "../query/query.service";
import { Pool } from "pg";
import { Hprops, Revent } from "src/requests/interfaces/request.dto";
import { lastValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { currentTimestamp } from "../utils/date";
@Injectable()
export class wfAgentService {
  constructor(
    @Inject("DATABASE_POOL") private readonly pool: Pool,
    private qs: queryService,
    private http: HttpService,
  ) {}
  async readNewEvent(eid: number) {
    try {
      const query = await this.qs.checkForNewEvent();
      const result = await this.pool.query(query, [eid, "NEW"]);
      if (result?.rows?.length > 0) {
        const event: Revent = result?.rows[0];
        this.checkActionsForEvent(event);
        return { code: 200, message: "Agent invoked" };
      } else {
        return { code: 400, message: "Agent not invoked" };
      }
    } catch (error) {
      return { code: 400, message: "Unable to process event" };
    }
  }

  async checkActionsForEvent(eDetails: Revent) {
    let alid;
    try {
      const query = await this.qs.getActionsForEvent();
      const result = await this.pool.query(query, [eDetails.ecode, false]);
      if (result?.rows?.length > 0) {
        const handlerList: Hprops[] = result?.rows;
        for (const handler of handlerList) {
          const createWfLog = await this.qs.createWfaLog();
          const logId = await this.pool.query(createWfLog, [
            handler.aid,
            eDetails.eid,
            "PROCESSING",
            currentTimestamp(),
          ]);

          const url = process.env.AXIOS_URL + `${handler?.ainfo?.endpoint}`;

          const body = {
            aid: handler?.aid,
            alid: logId?.rows[0]?.lid,
            eid: eDetails?.eid,
            ecode: eDetails.einfo.event,
            eby: eDetails.einfo.event_by,
            edetails: eDetails.einfo.edetails,
          };
          alid = body?.alid;
          const response = await lastValueFrom(this.http.post(url, body));
          if (response?.status === 200) {
            await this.updateEventStatus(eDetails.eid);
          } else {
            await this.updateEventStatus(eDetails.eid);
            const query = await this.qs.updateWfaLog();
            const result = await this.pool.query(query, [
              "FAILURE",
              currentTimestamp(),
              body?.alid,
            ]);
          }
        }
      } else {
        await this.updateEventStatus(eDetails.eid);
      }
    } catch (error) {
      await this.updateEventStatus(eDetails.eid);
      const query = await this.qs.updateWfaLog();
      const result = await this.pool.query(query, [
        "FAILURE",
        currentTimestamp(),
        alid,
      ]);
      console.error("Error during API call for handler::", error);
    }
  }

  async updateEventStatus(eid) {
    const query = await this.qs.updateEvent();
    const result = await this.pool.query(query, ["READ", eid]);
  }
}
