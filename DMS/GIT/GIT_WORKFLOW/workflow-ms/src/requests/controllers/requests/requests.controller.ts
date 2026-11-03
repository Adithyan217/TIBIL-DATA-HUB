/* eslint-disable @typescript-eslint/no-unused-vars */
import { Body, Controller, Get, Post, Res } from "@nestjs/common";
import { Response } from "express";
import { Hinfo, Wrequest } from "src/requests/interfaces/request.dto";
import { wfAgentService } from "src/requests/services/wfagent/wfagent.service";
import { WfalogService } from "src/requests/services/wfalog/wfalog.service";
import { wfEventsService } from "src/requests/services/wfevents/wfevents.service";
import { wfHandlerService } from "src/requests/services/wfhandler/wfhandler.service";
import { WfhlogService } from "src/requests/services/wfhlog/wfhlog.service";
import { handler_message } from "../../services/enum/handler_message.enum";
import { event_message } from "../../services/enum/event_messages.enum";

@Controller("requests")
export class RequestsController {
  constructor(
    private wfe: wfEventsService,
    private wfa: wfAgentService,
    private wfh: wfHandlerService,
    private al: WfalogService,
    private hl: WfhlogService,
  ) {}

  @Get("ping")
  async ping(@Res() res: Response) {
    res.status(200).send("OK");
  }

  @Post("wfevents")
  async createRequests(@Body() details: Wrequest, @Res() res: Response) {
    try {
      const result = await this.wfe.addRequests(details);
      if (result?.code === 200) {
        res.status(201).send(result);
      } else {
        res.status(400).send(result);
      }
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Unable to create a record",
      });
    }
  }

  @Post("wfagent")
  async invokeWfAgent(
    @Body() details: { event_id: number },
    @Res() res: Response,
  ) {
    try {
      const result = await this.wfa.readNewEvent(details?.event_id);
      if (result?.code === 200) {
        res.status(201).send(result);
      } else {
        res.status(400).send(result);
      }
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Unable to create a record",
      });
    }
  }

  @Post("wfhandler")
  async triggerHandler(@Body() event: Hinfo, @Res() res: Response) {
    try {
      const result = await this.wfh.eventProcessor(event);
      if (result?.code === 200) {
        res.status(200).send(result);
      } else {
        res.status(400).send(result);
      }
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Unable to create a record",
      });
    }
  }

  @Post("wfevents/status/get")
  async getActionLog(
    @Body() eventObj: { event_id: number },
    @Res() res: Response,
  ) {
    try {
      if (!eventObj?.event_id || typeof eventObj?.event_id !== "number") {
        res?.status(400).send({ code: 400, error: "Incorrect event_id" });
      }
      const result = await this.al.getActionLogDetails(eventObj?.event_id);
      if (result?.code === 200) {
        res.status(200).send(result);
      } else {
        res.status(400).send(result);
      }
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Unable to create a record",
      });
    }
  }

  @Post("/wfactions/details/get")
  async getHandlerLog(
    @Body() eventObj: { event_id: number },
    @Res() res: Response,
  ) {
    try {
      if (!eventObj?.event_id || typeof eventObj?.event_id !== "number") {
        res?.status(400).send({ code: 400, error: "Incorrect event_id" });
      }
      const result = await this.hl.getHandlerLogDetails(eventObj?.event_id);
      if (result?.code === 200) {
        res.status(200).send(result);
      } else {
        res.status(400).send(result);
      }
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Unable to create a record",
      });
    }
  }

  @Post("wfhandler/status/get")
  async getHandleLogStatus(
    @Body() body: { eid: number; aid: number },
    @Res() res: Response,
  ) {
    try {
      const result = await this.wfh.getHandlerStatusExecution(
        body.aid,
        body.eid,
      );
      res
        .status(result.code === handler_message.ERROR_CODE ? 400 : 200)
        .send(result);
    } catch (e) {
      res.status(500).json({
        code: handler_message.ERROR_CODE,
        message: e.message,
      });
    }
  }

  @Post("wfevents/get")
  async getEvents(
    @Body() body: any,
    @Res() res: Response,
  ) {
    try {
      body.pagination.offset = body.pagination.offset || 0;
      body.pagination.limit = body.pagination.limit || 10;
      const result = await this.wfe.getEventLogsExecution(body);
      res
        .status(result.code === event_message.ERROR_CODE ? 400 : 200)
        .send(result);
    } catch (e) {
      res.status(500).json({
        code: event_message.ERROR_CODE,
        message: e.message,
      });
    }
  }

  @Post("actions/get")
  async getActions(
    @Res() res: Response,
  ) {
    try {
      const result = await this.al.getActionTypes();
      res.status(200).send(result);
    } catch (e) {
      res.status(500).json({
        code: handler_message.ERROR_CODE,
        message: e.message,
      });
    }
  }
}
