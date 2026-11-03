import { Test, TestingModule } from "@nestjs/testing";
import { wfAgentService } from "./wfagent.service";
import { HttpService } from "@nestjs/axios";
import { queryService } from "../query/query.service";
import { Pool } from "pg";
import { of, throwError } from "rxjs";
import { Revent } from "src/requests/interfaces/request.dto";
import {WinstonLoggerService} from "../winstonlogger/winstonlogger.service";

const mockEvent: Revent = {
  "eid": 1,
  "eby": "123@abc",
  "ecode": "ONBOARD_BANK",
  "status": "NEW",
  "einfo": {
  "event": "ONBOARD_BANK",
    "event_by":"123@abc",
    "edetails": [
        {
            "row_id":1,
            "bank_name": "bank_1234567111",
            "baddr": "123 Finance Street",
            "binfo": {
                "name": "John Doe",
                "phno":"+911234567890",
                "email": "johndoe@fnb.com"
            }
        },
        {
            "row_id":2,
            "bank_name": "bank_1234567111",
            "baddr": "123 Finance Street",
            "binfo": {
                "name": "John Doe",
                "phno":"+911234567890",
                "email": "johndoe@fnb.com"
            }
        }
    ]
  }
};

const mockHandlers = [
  {
    aid: 101,
    ainfo: {
      endpoint: "/test-endpoint",
    },
  },
];

const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};
const queryServiceMock = {
  checkForNewEvent: jest.fn(),
  getActionsForEvent: jest.fn(),
  createWfaLog: jest.fn(),
  updateEvent: jest.fn(),
  updateWfalogForNoHandlerFound: jest.fn(),
};

describe("wfAgentService", () => {
  let service: wfAgentService;
  let httpService: HttpService;
  let pool: Pool;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        wfAgentService,
        { provide: WinstonLoggerService, useValue: mockLogger },
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
    it("should return 200 and invoke agent when event exists", async () => {
      const query = "SELECT * FROM events WHERE ...";
      (queryServiceMock.checkForNewEvent as jest.Mock).mockResolvedValue(query);
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockEvent] });

      const spy = jest.spyOn(service, "checkActionsForEvent").mockImplementation(async () => {});

      const result = await service.readNewEvent(1, "test-token");

      expect(queryServiceMock.checkForNewEvent).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalledWith(query, [1, "NEW"]);
      expect(spy).toHaveBeenCalledWith(mockEvent, "test-token");
      expect(result).toEqual({ code: 200, message: "Agent invoked" });
    });

    it("should return 400 when no new event found", async () => {
      const query = "SELECT * FROM events WHERE ...";
      (queryServiceMock.checkForNewEvent as jest.Mock).mockResolvedValue(query);
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await service.readNewEvent(1, "test-token");

      expect(result).toEqual({ code: 400, message: "Agent not invoked" });
    });

    it("should return 400 on error", async () => {
      (queryServiceMock.checkForNewEvent as jest.Mock).mockRejectedValue(new Error("DB error"));

      const result = await service.readNewEvent(1, "test-token");

      expect(result).toEqual({ code: 400, message: "Unable to process event" });
    });
  });

  describe("checkActionsForEvent", () => {
    it("should process handler and update event when API returns 200", async () => {
      const query = "SELECT * FROM actions WHERE ...";
      (queryServiceMock.getActionsForEvent as jest.Mock).mockResolvedValue(query);
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockHandlers }) // getActionsForEvent
        .mockResolvedValueOnce({ rows: [{ lid: 500 }] }); // createWfaLog result
      (queryServiceMock.createWfaLog as jest.Mock).mockResolvedValue("INSERT INTO ...");
      (httpService.post as jest.Mock).mockReturnValue(of({ status: 200 }));
      (queryServiceMock.updateEvent as jest.Mock).mockResolvedValue("UPDATE ...");

      await service.checkActionsForEvent(mockEvent, "test-token");

      expect(httpService.post).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalledTimes(3);
    });

    it("should update log with failure when API returns non-200", async () => {
      (queryServiceMock.getActionsForEvent as jest.Mock).mockResolvedValue("query");
      (queryServiceMock.createWfaLog as jest.Mock).mockResolvedValue("log query");
      (queryServiceMock.updateWfalogForNoHandlerFound as jest.Mock).mockResolvedValue("update-log");
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockHandlers }) // get actions
        .mockResolvedValueOnce({ rows: [{ lid: 501 }] }) // create log
        .mockResolvedValueOnce({}) // update event status
        .mockResolvedValueOnce({}); // update log with failure

      (httpService.post as jest.Mock).mockReturnValue(of({ status: 500 }));

      await service.checkActionsForEvent(mockEvent, "token");
      expect(pool.query).toHaveBeenCalledTimes(4);
    });

    it("should handle errors gracefully and mark log as failure", async () => {
      (queryServiceMock.getActionsForEvent as jest.Mock).mockResolvedValue("query");
      (queryServiceMock.createWfaLog as jest.Mock).mockResolvedValue("log query");
      (queryServiceMock.updateWfalogForNoHandlerFound as jest.Mock).mockResolvedValue("update-log");

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockHandlers }) // get actions
        .mockResolvedValueOnce({ rows: [{ lid: 999 }] }) // create log
        .mockResolvedValueOnce({}) // update event
        .mockResolvedValueOnce({}); // update log

      (httpService.post as jest.Mock).mockImplementation(() => throwError(() => new Error("API error")));

      await service.checkActionsForEvent(mockEvent, "token");

      expect(httpService.post).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalledTimes(4);
    });

    it("should just update event status when no handlers found", async () => {
      (queryServiceMock.getActionsForEvent as jest.Mock).mockResolvedValue("query");
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await service.checkActionsForEvent(mockEvent, "token");

      expect(pool.query).toHaveBeenCalledTimes(2);
    });
  });
});
