import { Test, TestingModule } from "@nestjs/testing";
import { wfAgentService } from "./wfagent.service";
import { HttpService } from "@nestjs/axios";
import { queryService } from "../query/query.service";
import { Pool } from "pg";
import { of, throwError } from "rxjs";
import { Revent } from "src/requests/interfaces/request.dto";

// Define the mock for the queryService
const queryServiceMock = {
  addReq: jest.fn(),
  checkForNewEvent: jest.fn(),
  checkHandlerForEvent: jest.fn(),
  createWfLog: jest.fn(),
  updateEvent: jest.fn(),
  updateWfLog: jest.fn(),
};

describe("wfAgentService", () => {
  let service: wfAgentService;
  let httpService: HttpService;
  let pool: Pool;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        wfAgentService,
        {
          provide: "DATABASE_POOL",
          useValue: {
            query: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: queryService,
          useValue: queryServiceMock,
        },
      ],
    }).compile();

    service = module.get<wfAgentService>(wfAgentService);
    httpService = module.get<HttpService>(HttpService);
    pool = module.get<Pool>("DATABASE_POOL");
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("readNewEvent", () => {
    it("should invoke the agent and call checkHandlerForEvent if new events are found", async () => {
      const eid = 1;
      const mockEvent = { eid, ecode: "EVENT_CODE", einfo: "Event Info" };
      pool.query.mockResolvedValueOnce({ rows: [mockEvent] });
      jest.spyOn(service, "checkHandlerForEvent").mockImplementation(jest.fn());
      const result = await service.readNewEvent(eid);
      expect(result).toEqual({ code: 200, message: "Agent invoked" });
      expect(service.checkHandlerForEvent).toHaveBeenCalledWith(mockEvent);
    });

    it("should handle when no events are found", async () => {
      const eid = 1;
      pool.query.mockResolvedValueOnce({ rows: [] });
      jest.spyOn(service, "checkHandlerForEvent").mockImplementation(jest.fn());
      const result = await service.readNewEvent(eid);
      expect(result).toEqual({ code: 400, message: "Agent not invoked" });
      expect(service.checkHandlerForEvent).not.toHaveBeenCalled();
    });

    it("should return 400 error if query throws an exception", async () => {
      const eid = 1;
      pool.query.mockRejectedValueOnce(new Error("Database error"));
      const result = await service.readNewEvent(eid);
      expect(result).toEqual({ code: 400, message: "Unable to process event" });
    });

    // Additional test case for handling empty results
    it("should return 400 if the query does not return any events", async () => {
      const eid = 1;
      pool.query.mockResolvedValueOnce({ rows: [] });
      const result = await service.readNewEvent(eid);
      expect(result).toEqual({ code: 400, message: "Agent not invoked" });
    });
  });

  it("should handle error during API call", async () => {
    const eDetails: Revent = {
      eid: 1,
      ecode: "CODE",
      einfo: "Details",
      eby: 1,
      status: "NEW",
    };
    const handlerList = [{ htype: "api", hid: 1 }];
    pool.query.mockResolvedValueOnce({ rows: handlerList });
    queryServiceMock.createWfLog.mockResolvedValueOnce("log_query");
    pool.query.mockResolvedValueOnce({ rows: [{ lid: 123 }] });

    jest
      .spyOn(httpService, "post")
      .mockReturnValue(throwError(() => new Error("API error")));
    jest.spyOn(service, "updateEventStatus").mockImplementation(jest.fn());

    await service.checkHandlerForEvent(eDetails);

    expect(service.updateEventStatus).not.toHaveBeenCalled();
  });
});
