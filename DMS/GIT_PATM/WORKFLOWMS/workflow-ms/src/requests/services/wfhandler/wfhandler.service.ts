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
import {WinstonLoggerService} from "../winstonlogger/winstonlogger.service";
import {CODE , generateResponse} from "../enum/common_messages.enum";
import { AxiosResponse } from 'axios';
import { error } from "console";

@Injectable()
export class wfHandlerService {
  constructor(
    @Inject("DATABASE_POOL") private readonly pool: Pool,
    private http: HttpService,
    private qs: queryService,
    protected wl:WinstonLoggerService
  ) {}

  async eventProcessor(event: Hinfo, token: string) {
    try {
      const fetchHandler = await this.qs.getHandlers();
      const result = await this.pool.query(fetchHandler, [event?.ecode]);
      if (result?.rows?.length > 0) {
        const steps = result?.rows;
        this.executeSteps(event, steps, token);
        return { code: 200, message: "Hanlder is processing" };
      } else {
        await this.updateWfActionLogForNoHandler("FAILURE", event?.alid);
        return { code: 400, error: "Unable to find the handler" };
      }
    } catch (error) {
      await this.updateWfActionLogForNoHandler("FAILURE", event?.alid);
      return { code: 400, error: "Unable to find the handler" };
    }
  }

  async executeSteps(
    event: Hinfo,
    steps: { sid: number; hinfo: { endpoint: string, sname: string,method: string } []}[],
    token: string
  ) {
    try {
      for (const step of steps) {
        for (const item of step?.hinfo) {
          const reqUrl =  item?.endpoint;
          const createStepLog = await this.qs.createStepLog();
          const result = await this.pool.query(createStepLog, [
            step.sid,
            item?.sname,
            event.aid,
            event.eid,
            "PROCESSING",
            currentTimestamp(),
          ]);
          if (result?.rows?.length > 0) {
            const slid = result?.rows[0]?.lid;
            let body = {
              eid: event?.eid,
              event: event?.ecode,
              event_by: event?.eby,
              ...(event?.edetails
                ? { edetails: event.edetails }
                : event?.rdetails
                ? { rdetails: event.rdetails }
                : {})
            };
            

            const response = await lastValueFrom(
              this.http[item?.method](reqUrl, body, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                validateStatus: function (status) {
                  return status < 500; // Resolve only if the status code is less than 500
                },
              }),
            )as AxiosResponse<any>;;

            if (response?.status === 200 || response?.status === 201) {
              this.wl.log(
                `Entering updation of handler process,
                ${JSON.stringify(response?.data?.edata)}`
              );
              await this.updateStepLogForHandler(
                "PROCESSED",
                slid,
                `[${JSON.stringify(response?.data?.edata)}]`,
              );



              const isChainableQuery = await this.qs.isChainableQuery();
              const isChainable = await this.pool.query(isChainableQuery, [
                event?.ecode,
              ]);
              if (isChainable?.rowCount > 0) {
                  this.eventChaining(event?.ecode,body, response?.data?.edata, event?.eby, token);
              }



            } else if (response?.status === 400) {
              this.wl.log(`Response from registry is::::, ${response.status}`);
              await this.updateStepLogForHandler(
                "FAILURE",
                slid,
                `[{"status": ${JSON.stringify(response?.data)}}]`,
              );
            } else {
              this.wl.log(
                `Unhandled response status from registry: ,
                ${response.status},
                ${response.data},
              `);
              await this.updateStepLogForHandler(
                "FAILURE",
                slid,
                `[{"status": ${JSON.stringify(response?.data)}}]`,
              );
            }
          }
        }
      }
      await this.updateWfActionLogForEvent(event?.eid, event?.alid,event?.aid); // Or handle differently if needed
    } catch (error) {
      this.wl.error("Error occurred in Handler Service:::", error);
      this.updateWfActionLogForEvent(event?.eid, event?.alid,event?.aid);
      return { code: 400, message: "Unable to invoke steps" };
    }
  }


  async eventChaining(pecode: string, request: any, response: any, eventBy: string, token: string) {
    try {
      const fetchChainableEvents = await this.qs.getChainableEvents(); // returns a query string
      const result = await this.pool.query(fetchChainableEvents, [pecode]);
  
      if (!result?.rows?.length) return;
  
      for (const row of result.rows) {
        const { cecode, ptype } = row;
  
        // Step 1: Create empty payload
        const Payload: any = {};
  
        // Step 2: Add static values to Payload
        Payload['event'] = cecode;
        Payload['event_by'] = eventBy;
  
        // Step 3: Add dynamic 'edetails' key based on ptype
        const edetails = ptype === 'req' ? request : response;
        Payload['edetails'] = edetails;

  
        // Step 6: Make axios call to wfevents
        const wfeventsUrl = process.env.AXIOS_URL + "/requests/wfevents";
        try {
          const wfeventsResp = await lastValueFrom(
            this.http.post(wfeventsUrl, Payload, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
          );
          this.wl.log(`Chained event ${cecode} triggered with response`);
        } catch (err) {
          this.wl.error(`Failed to trigger chained event ${cecode}`, err?.response?.data || err.message);
        }
      }
    } catch (error) {
      this.wl.error('Error during event chaining:', error);
    }
  }
  

  async updateWfActionLogForEvent(event_id, alid,aid) {
    const query = await this.qs.updateWfaLog();
    const res = await this.pool.query(query, [event_id, alid,aid]);
    if(res.rowCount > 0){
      this.wl.log("Updated the action log for event");
    }
  }

  async updateWfActionLogForNoHandler(status, alid){
    const query = await this.qs.updateWfalogForNoHandlerFound();
    const res = await this.pool.query(query, [status, alid]);
    if(res.rowCount > 0){
      this.wl.log("Updated the action log for event");
    }
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
      let steps:any= []
      if (result.rowCount === 0) {
        return {
          code: handler_message.FAILURE_CODE,
          message: handler_message.NO_RECORDS,
        };
      }

        const response = result.rows.reduce( (acc , row) => {
          const stepName = row.sname; // Step identifier
          steps = [ ...steps,stepName]
          // ✅ Ensure `stepName` object exists before accessing properties
          if (!acc[stepName]) {
            acc[stepName] = {};
          }

          if (row.hstatus === "PROCESSED" && row.hdetails) {
            acc[stepName] = {
              hstatus: row.hstatus,
              hdetails: row.hdetails,
            }
            /*row.hdetails.forEach( (hdetail) => {
              const row_id_index = hdetail.headers.indexOf( "row_id" );
              const message_index = hdetail.headers.indexOf( "msgs" );
              const status_index =  hdetail.headers.indexOf( "status" );

              if (row_id_index === -1 || message_index === -1 || status_index == -1) return;

              hdetail.values.forEach( (value) => {
                acc[stepName]["data"].push( {
                                              row_id : value[row_id_index] ,
                                              status : value[status_index],
                                              msg : value[message_index] ,
                                            });
              });

              // ✅ Update `status` only if it's available
              if (hdetail.status) {
                acc[stepName]["status"] = hdetail.status;
              }
            });*/
          } else {
            /*acc[stepName]["data"].push({
                                          status : row.hstatus ,
                                          msg : row.hstatus ,
                                        });

            // ✅ Update `status` for non-PROCESSED cases
            acc[stepName]["status"] = row.hstatus;*/
            acc[stepName] = {
              hstatus: row.hstatus,
            }
          }

          return acc;
        } , {}  ); // ✅ Proper type definition

        return generateResponse(200, CODE.SUCCESS, response, {steps});


       /* return {
          code: handler_message.SUCCESS_CODE,
          steps,
          data: result.rows,
        };*/


    } catch (e) {
      return generateResponse(400, CODE.ERROR, e.message);
    }
  }

}
