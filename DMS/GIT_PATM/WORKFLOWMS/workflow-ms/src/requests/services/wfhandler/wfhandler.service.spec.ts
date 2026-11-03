import { Test, TestingModule } from "@nestjs/testing";
import { wfHandlerService } from "./wfhandler.service";
import { HttpService } from "@nestjs/axios";
import { queryService } from "../query/query.service";
import { Pool } from "pg";
import { of } from "rxjs";
import { WinstonLoggerService } from "../winstonlogger/winstonlogger.service";

const queryServiceMock = {
  getHandlers: jest.fn(),
  createStepLog: jest.fn(),
  updateStepLog: jest.fn(),
  updateWfalogForNoHandlerFound: jest.fn(),
  updateWfaLog: jest.fn(),
  getHandlerStatusQuery: jest.fn(),
};

const mockHttpService = {
  post: jest.fn(),
  put: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
};

const mockPool = {
  query: jest.fn(),
};

const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

describe("wfHandlerService", () => {
  let service: wfHandlerService;

  beforeEach(async () => {
    process.env.AXIOS_URL = "http://localhost/api";

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        wfHandlerService,
        { provide: "DATABASE_POOL", useValue: mockPool },
        { provide: HttpService, useValue: mockHttpService },
        { provide: queryService, useValue: queryServiceMock },
        { provide: WinstonLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<wfHandlerService>(wfHandlerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("eventProcessor", () => {
    const event = {
      eid: 1,
      aid: 100,
      ecode: "ONBOARD_BANK",
      alid: 50,
      eby: "admin",
      edetails: [
        {
          row_id: 1,
          bank_name: "bank_1234567111",
          baddr: "123 Finance Street",
          binfo: {
            name: "John Doe",
            phno: "+911234567890",
            email: "johndoe@fnb.com",
          },
        },
        {
          row_id: 2,
          bank_name: "bank_1234567111",
          baddr: "123 Finance Street",
          binfo: {
            name: "John Doe",
            phno: "+911234567890",
            email: "johndoe@fnb.com",
          },
        },
      ],
    };

    it("should process steps when handlers are found", async () => {
      queryServiceMock.getHandlers.mockResolvedValue("SELECT ...");
      mockPool.query.mockResolvedValueOnce({
        rows: [{ sid: 10, hinfo: [{ endpoint: "/handler", sname: "step1", method: "post" }] }],
      });

      const executeSpy = jest.spyOn(service, "executeSteps").mockImplementation(async () => undefined);

      const result = await service.eventProcessor(event, "token");

      expect(result).toEqual({ code: 200, message: "Hanlder is processing" }); // updated message
      expect(executeSpy).toHaveBeenCalledWith(event, expect.any(Array), "token");
    });

    it("should return error if no handler is found", async () => {
      queryServiceMock.getHandlers.mockResolvedValue("SELECT ...");
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      queryServiceMock.updateWfalogForNoHandlerFound.mockResolvedValue("UPDATE");
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const result = await service.eventProcessor(event, "token");

      expect(result).toEqual({ code: 400, error: "Unable to find the handler" });
    });

    it("should return error if exception is thrown", async () => {
      queryServiceMock.getHandlers.mockRejectedValue(new Error("DB Error"));
      queryServiceMock.updateWfalogForNoHandlerFound.mockResolvedValue("UPDATE");
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const result = await service.eventProcessor(event, "token");

      expect(result).toEqual({ code: 400, error: "Unable to find the handler" });
    });
  });

  describe("executeSteps", () => {
    const event = {
      eid: 1,
      aid: 100,
      ecode: "ONBOARD_BANK",
      alid: 50,
      eby: "admin",
      edetails: [
        {
          row_id: 1,
          bank_name: "bank_1234567111",
          baddr: "123 Finance Street",
          binfo: {
            name: "John Doe",
            phno: "+911234567890",
            email: "johndoe@fnb.com",
          },
        },
        {
          row_id: 2,
          bank_name: "bank_1234567111",
          baddr: "123 Finance Street",
          binfo: {
            name: "John Doe",
            phno: "+911234567890",
            email: "johndoe@fnb.com",
          },
        },
      ],
    };

    const steps = [
      {
        sid: 1,
        hinfo: [{ endpoint: "/step", sname: "Step1", method: "post" }],
      },
    ];

    it("should process a handler step successfully", async () => {
      queryServiceMock.createStepLog.mockResolvedValue("INSERT...");
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ lid: 123 }] }) // step log creation
        .mockResolvedValueOnce({}); // updateStepLogForHandler mock

      // Mock HTTP post call
      mockHttpService.post.mockReturnValue(
        of({ status: 200, data: { edata: { msg: "success" } } })
      );

      queryServiceMock.updateStepLog.mockResolvedValue("UPDATE");
      queryServiceMock.updateWfaLog.mockResolvedValue("UPDATE");

      mockPool.query.mockResolvedValueOnce({ rowCount: 1 }); // updateWfActionLogForEvent

      await service.executeSteps(event, steps, "token");

      expect(mockHttpService.post).toHaveBeenCalledWith(
        "http://localhost/api/step",
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer token" }),
        })
      );
      expect(mockPool.query).toHaveBeenCalled();
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining("Entering updation of handler process")
      );
    });

    it("should handle 400 response", async () => {
      queryServiceMock.createStepLog.mockResolvedValue("INSERT...");
      mockPool.query.mockResolvedValueOnce({ rows: [{ lid: 999 }] });

      mockHttpService.post.mockReturnValue(
        of({
          status: 400,
          data: { error: "bad" },
        })
      );

      queryServiceMock.updateStepLog.mockResolvedValue("UPDATE STEP LOG");
      mockPool.query.mockResolvedValueOnce({ rowCount: 1, rows: [] }); // updateStepLogForHandler

      queryServiceMock.updateWfaLog.mockResolvedValue("UPDATE WFA LOG");
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 }); // updateWfActionLogForEvent

      await service.executeSteps(event, steps, "token");

      expect(mockHttpService.post).toHaveBeenCalled();
      expect(mockPool.query).toHaveBeenCalledTimes(3);
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining("Response from registry is::::")
      );
    });

    it("should handle unknown response status (e.g. 500)", async () => {
      queryServiceMock.createStepLog.mockResolvedValue("INSERT...");
      mockPool.query.mockResolvedValueOnce({ rows: [{ lid: 999 }] });

      mockHttpService.post.mockReturnValue(
        of({
          status: 500,
          data: "error data",
        })
      );

      queryServiceMock.updateStepLog.mockResolvedValue("UPDATE STEP LOG");
      mockPool.query.mockResolvedValueOnce({ rowCount: 1, rows: [] }); // updateStepLogForHandler

      queryServiceMock.updateWfaLog.mockResolvedValue("UPDATE WFA LOG");
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 }); // updateWfActionLogForEvent

      await service.executeSteps(event, steps, "token");

      expect(mockHttpService.post).toHaveBeenCalled();
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining("Unhandled response status from registry")
      );
    });

    it("should handle errors and return failure", async () => {
      queryServiceMock.createStepLog.mockResolvedValue("INSERT...");
      mockPool.query.mockResolvedValueOnce({ rows: [{ lid: 999 }] });

      mockHttpService.post.mockReturnValue(
        of({
          status: 200,
          data: { edata: "success" },
        })
      );

      queryServiceMock.updateStepLog.mockImplementation(() => {
        throw new Error("DB Error");
      });

      const result = await service.executeSteps(event, steps, "token");

      expect(result).toEqual({ code: 400, message: "Unable to invoke steps" });
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Error occurred in Handler Service:::"),
        expect.any(Error)
      );
    });
  });

  describe("getHandlerStatusExecution", () => {
    it("should return success with steps and data", async () => {
      const rows = [
        { sname: "step1", hstatus: "PROCESSED", hdetails: "details" },
        { sname: "step2", hstatus: "FAILURE", hdetails: null },
      ];
      queryServiceMock.getHandlerStatusQuery.mockResolvedValue("SELECT ...");
      mockPool.query.mockResolvedValue({ rowCount: 2, rows });

      const response = await service.getHandlerStatusExecution(1, 2);

      expect(response.code).toBe(200);
      expect(response.metadata.steps).toContain("step1");
      expect(response.metadata.steps).toContain("step2");
      expect(response.data).toHaveProperty("step1");
      expect(response.data).toHaveProperty("step2");
    });

    it("should return failure if no records", async () => {
      queryServiceMock.getHandlerStatusQuery.mockResolvedValue("SELECT ...");
      mockPool.query.mockResolvedValue({ rowCount: 0, rows: [] });

      const response = await service.getHandlerStatusExecution(1, 2);

      expect(response.code).toBe(400);
      expect(response.message).toBeDefined();
    });

    it("should return error if exception thrown", async () => {
      queryServiceMock.getHandlerStatusQuery.mockRejectedValue(new Error("DB error"));

      const response = await service.getHandlerStatusExecution(1, 2);

      expect(response.code).toBe(400);
      expect(response.message).toBe("DB error");
    });
  });


});
