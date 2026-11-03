/* eslint-disable no-console */
import { Inject, Injectable } from "@nestjs/common";
import { queryService } from "../query/query.service";
import { Pool } from "pg";
import { Hprops, Revent } from "src/requests/interfaces/request.dto";
import { lastValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { currentTimestamp } from "../utils/date";
import {WinstonLoggerService} from "../winstonlogger/winstonlogger.service";
@Injectable()
export class wfAgentService {
  constructor(
    @Inject("DATABASE_POOL") private readonly pool: Pool,
    private qs: queryService,
    private http: HttpService,
    protected wl:WinstonLoggerService
  ) {}
  async readNewEvent(eid: number, token: string) {
    try {
      const query = await this.qs.checkForNewEvent();
      const result = await this.pool.query(query, [eid, "NEW"]);
      if (result?.rows?.length > 0) {
        const event: Revent = result?.rows[0];
        this.checkActionsForEvent(event, token);
        return { code: 200, message: "Agent invoked" };
      } else {
        return { code: 400, message: "Agent not invoked" };
      }
    } catch (error) {
      return { code: 400, message: "Unable to process event" };
    }
  }

  async checkActionsForEvent(eDetails: Revent, token: string) {
    let alid;
    try {
      const query = await this.qs.getActionsForEvent();
      const result = await this.pool.query(query, [eDetails.ecode, false]);
      if (result?.rows?.length > 0) {
        let peid = eDetails?.einfo?.peid || null;
        const handlerList: Hprops[] = result?.rows;
        for (const handler of handlerList) {
          const createWfLog = await this.qs.createWfaLog(peid);
          const logId = await this.pool.query(createWfLog, [
            handler.aid,
            eDetails.eid,
            "PROCESSING",
            currentTimestamp(),
            peid
          ]);

          const url = process.env["AXIOS-URL"] + `${handler?.ainfo?.endpoint}`;

          const body = {
            aid: handler?.aid,
            alid: logId?.rows[0]?.lid,
            eid: eDetails?.eid,
            ecode: eDetails.einfo.event,
            eby: eDetails.einfo.event_by,
            ...(typeof eDetails.einfo.edetails !== "undefined"
              ? { edetails: eDetails.einfo.edetails }
              : typeof eDetails.einfo.rdetails !== "undefined"
              ? { rdetails: eDetails.einfo.rdetails }
              : {})
          };
          ;
          alid = body?.alid;
          const response = await lastValueFrom(this.http.post(url, body, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }));
          if (response?.status === 200) {
            await this.updateEventStatus(eDetails.eid);
          } else {
            await this.updateEventStatus(eDetails.eid);
            const query = await this.qs.updateWfalogForNoHandlerFound();
            const result = await this.pool.query(query, [
              "FAILURE",
              body?.alid
            ]);
          }
        }
      } else {
        await this.updateEventStatus(eDetails.eid);
      }
    } catch (error) {
      await this.updateEventStatus(eDetails.eid);
      const query = await this.qs.updateWfalogForNoHandlerFound();
      const result = await this.pool.query(query, [
        "FAILURE",
        alid
      ]);
     this.wl.error("Error during API call for handler::", error);
    }
  }

  async updateEventStatus(eid) {
    const query = await this.qs.updateEvent();
    const result = await this.pool.query(query, ["READ", eid]);
  }
}
