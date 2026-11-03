/* eslint-disable @typescript-eslint/no-unused-vars */
import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { Response } from "express";
import { Hinfo, Wrequest } from "src/requests/interfaces/request.dto";
import { wfAgentService } from "src/requests/services/wfagent/wfagent.service";
import { WfalogService } from "src/requests/services/wfalog/wfalog.service";
import { wfEventsService } from "src/requests/services/wfevents/wfevents.service";
import { wfHandlerService } from "src/requests/services/wfhandler/wfhandler.service";
import { WfhlogService } from "src/requests/services/wfhlog/wfhlog.service";
import { handler_message } from "../../services/enum/handler_message.enum";
import { event_message } from "../../services/enum/event_messages.enum";
import { commonService } from "src/requests/services/common/common.service";
import {WinstonLoggerService} from "../../services/winstonlogger/winstonlogger.service";
import {CODE, MESSAGE, generateResponse } from '../../services/enum/common_messages.enum';
@Controller("requests")
export class RequestsController {
  constructor(
    private wfe: wfEventsService,
    private wfa: wfAgentService,
    private wfh: wfHandlerService,
    private al: WfalogService,
    private hl: WfhlogService,
    private cs: commonService,
    protected wl: WinstonLoggerService
  ) {}
  // infoCommonLogger = (request) => {
  //   this.wl.log(` ${request.method} ${request.url} -  Incoming request`);
  // }
  // errorCommonLogger = (request, error) => {
  //   this.wl.error(` ${request.method} ${request.url} -  ${error}`);
  // }
  @Get("ping")
  async ping(@Res() res: Response, @Req() req ) {
    // this.infoCommonLogger(req);
    res.status(200).send(`workflow-ms  operational Version: ${process.env.MAJOR_VERSION}.${process.env.MINOR_VERSION}`);
  }

  @Post("wfevents")
  async createRequests(@Body() details: Wrequest, @Req()req:any, @Res() res: Response) {
    try {
      // this.infoCommonLogger(req);
      details["role"] = req?.user.role;
      details["userName"] = req?.user.userName; 
      const token = req?.headers?.authorization.split(' ')[1];
      const result = await this.wfe.addRequests(details, token);

        res.status(result.status).send(result.data);
    } catch (error) {
      // this.errorCommonLogger(req, error)
      return  res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

    }
  }

  @Post("wfagent")
  async invokeWfAgent(
    @Body() details: { event_id: number },
    @Res() res: Response,
    @Req() req:any
  ) {
    try {
      // this.infoCommonLogger(req);
      const token = req?.headers?.authorization.split(' ')[1];
      const result = await this.wfa.readNewEvent(details?.event_id, token);
      if (result?.code === 200) {
        res.status(201).send(result);
      } else {
        res.status(400).send(result);
      }
    } catch (error) {
      // this.errorCommonLogger(req, error)
      return res.status(500).json({
        status: 500,
        message: "Unable to create a record",
      });
    }
  }

  @Post("wfhandler")
  async triggerHandler(@Body() event: Hinfo, @Res() res: Response,  @Req()req:any) {
    try {
      // this.infoCommonLogger(req);
      const token = req?.headers?.authorization.split(' ')[1];
      const result = await this.wfh.eventProcessor(event, token);
      if (result?.code === 200) {
        res.status(200).send(result);
      } else {
        res.status(400).send(result);
      }
    } catch (error) {
      // this.errorCommonLogger(req, error)
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
    @Req()req:any
  ) {
    try {
      // this.infoCommonLogger(req);
      if (!eventObj?.event_id || typeof eventObj?.event_id !== "number") {
        res?.status(400).send({ code: 400, error: "Incorrect event_id" });
      }
      const result = await this.al.getActionLogDetails(eventObj?.event_id);
      res.status(result.status).send(result.data);

    } catch (error) {
      // this.errorCommonLogger(req, error)
      return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

    }
  }

  @Post("/wfactions/details/get")
  async getHandlerLog(
    @Body() eventObj: { event_id: number },
    @Res() res: Response,
    @Req()req:any
  ) {
    try {
      // this.infoCommonLogger(req);
      if (!eventObj?.event_id || typeof eventObj?.event_id !== "number") {
        res?.status(400).send({ code: 400, error: "Incorrect event_id" });
      }
      const result = await this.hl.getHandlerLogDetails(eventObj?.event_id);
      res.status(result.status).send(result.data);

    } catch (error) {
      // this.errorCommonLogger(req, error)
      res.status(error.statusCode || 500).send({message: error.message || 'An unexpected error occurred'});
    }
  }

  @Post("wfhandler/status/get")
  async getHandleLogStatus(
    @Body() body: { eid: number; aid: number },
    @Res() res: Response,
    @Req()req:any
  ) {
    try {
      // this.infoCommonLogger(req);
      const result = await this.wfh.getHandlerStatusExecution(
        body.aid,
        body.eid,
      );
       return res
        .status(result.status)
        .send(result.data);
    } catch (error) {
      // this.errorCommonLogger(req, error)
      return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

    }
  }

  @Post("wfevents/get")
  async getEvents(
    @Body() body: any,
    @Res() res: Response,
    @Req() req: any
  ) {
    try {
      // this.infoCommonLogger(req);
      body["role"] = req?.user.role;
      body["userName"] = req?.user.userName;
      body.pagination.offset = body.pagination.offset || 0;
      body.pagination.limit = body.pagination.limit || 10;
      const result = await this.wfe.getEventLogsExecution(body);
      return res.status(result.status).send(result.data);
    } catch (error) {
      // this.errorCommonLogger(req, error)
      return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

    }
  }

  @Post("actions/get")
  async getActions(
    @Res() res: Response,
    @Req() req: any
  ) {
    try {
      // this.infoCommonLogger(req);
      const role = req?.user.role;
      const result = await this.al.getActionTypes(role);
      res.status(result.status).send(result.data);
    } catch (error) {
      // this.errorCommonLogger(req, error);
      return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

    }
  }

  @Post("event-history/get")

  async getEventHistory(
    @Body() body: { request_id: number },
    @Res() res: Response,
    @Req() req: any
  ) {
    try {
      // this.infoCommonLogger(req);
      const result = await this.wfe.getEventHistory(body.request_id);
      return res.status(result.status).send(result.data);
    } catch (e) {
      // this.errorCommonLogger(req, e)
      return res.status( e.statusCode || 500 ).send( {message : e.message || 'An unexpected error occurred'} );

    }
  }


  @Post('user-permission')
  async addUpermissions(@Body() body:any, @Res() res: Response, @Req() req: any) {
    try{
      // this.infoCommonLogger(req);
      const result =  await this.cs.addUserPermissions(body)
      return  res.status(result.status).send(result.data);
      } catch (error) {
        // this.errorCommonLogger(req, error)
      return res.status( error.statusCode || 500 ).send( {message : error.message || 'An unexpected error occurred'} );

    }
  }
}
