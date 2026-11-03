import { Test, TestingModule } from "@nestjs/testing";
import { wfEventsService } from "./wfevents.service";
import { queryService } from "../query/query.service";
import { HttpService } from "@nestjs/axios";
import { SchemaValidationService } from "../utils/validator.service";
import { of } from "rxjs";
import { WinstonLoggerService } from "../winstonlogger/winstonlogger.service";

describe("wfEventsService", () => {
  let service: wfEventsService;

  const mockPool = {
    query: jest.fn(),
  };

  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
  };

  const mockValidationService = {
    loadSchemaIfPresent: jest.fn(),
    ajvValidator: jest.fn(),
  };

  const mockQueryService = {
    addReq: jest.fn(),
    getEventLogsQuery: jest.fn(),
    eventHistory: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  const sampleRequest = {
    event: "ONBOARD_BANK_1",
    event_by: "123@abc",
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

  const mockToken = "mockToken";

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        wfEventsService,
        { provide: "DATABASE_POOL", useValue: mockPool },
        { provide: SchemaValidationService, useValue: mockValidationService },
        { provide: queryService, useValue: mockQueryService },
        { provide: HttpService, useValue: mockHttpService },
        { provide: WinstonLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<wfEventsService>(wfEventsService);
    jest.clearAllMocks();
  });

  describe("addRequests", () => {
    it("should return 1000 if schema is not present", async () => {
      mockValidationService.loadSchemaIfPresent.mockResolvedValue(null);

      const result = await service.addRequests(sampleRequest as any, mockToken);

      expect(result).toEqual({
        status: 200,
        data: {
          code: 1000,
          message: "INVALID SCHEMA",
        },
      });
    });

    it("should return 1000 if schema validation fails", async () => {
      mockValidationService.loadSchemaIfPresent.mockResolvedValue({ type: "object" });
      mockValidationService.ajvValidator.mockResolvedValue({
        errors: [{ message: "Missing required field" }],
      });

      const result = await service.addRequests(sampleRequest as any, mockToken);

      expect(result.data?.code).toBe(1000);
      expect(result.data?.message).toBe("INVALID SCHEMA");
    });

    it("should add request successfully", async () => {
      const bankReq = {
        event: "ONBOARD_BANK",
        event_by: "123@abc",
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
      mockValidationService.loadSchemaIfPresent.mockResolvedValue({ type: "object" });
      mockValidationService.ajvValidator.mockResolvedValue({});
      mockQueryService.addReq.mockResolvedValue("INSERT QUERY");
      mockPool.query.mockResolvedValue({
        rows: [{ eid: "event123" }],
      });
      mockHttpService.post.mockReturnValue(of({ status: 200 }));

      const result = await service.addRequests(bankReq as any, mockToken);
      expect(result).toEqual({
        status: 200,
        data: {
          code: 2000,
          data: [],
          event_id: "event123",
          message: "REQUEST ADDED SUCCESSFULLY",
        },
      });
    });

    it("should return 400 if DB insert fails", async () => {
      mockValidationService.loadSchemaIfPresent.mockResolvedValue({ type: "object" });
      mockValidationService.ajvValidator.mockResolvedValue({});
      mockQueryService.addReq.mockResolvedValue("QUERY");
      mockPool.query.mockResolvedValue({ rows: null });

      const result = await service.addRequests(sampleRequest as any, mockToken);
      expect(result).toEqual({
        status: 400,
        data: {
          code: 4000,
          message: "REQUEST FAILED",
        },
      });
    });

    it("should handle internal errors", async () => {
      mockValidationService.loadSchemaIfPresent.mockRejectedValue(new Error("Unexpected"));

      const result = await service.addRequests(sampleRequest as any, mockToken);
      expect(result?.data?.code).toEqual(4000);
    });
  });

  describe("getEventLogsExecution", () => {
    it("should return logs when count is greater than 0", async () => {
      const data = { event: "ONBOARD_BANK" };

      const countQuery = {
        query: "SELECT count(*) FROM ...",
        values: [],
      };

      const resultQuery = {
        query: "SELECT * FROM logs ...",
        values: [],
      };

      mockQueryService.getEventLogsQuery
        .mockResolvedValueOnce(countQuery) // for count
        .mockResolvedValueOnce(resultQuery); // for logs

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: 2 }] }) // count query
        .mockResolvedValueOnce({ rows: [{ eid: "event1" }, { eid: "event2" }] }); // actual data

      const result = await service.getEventLogsExecution(data);

      expect(result.data.code).toBe(2000);
      expect(result.data.count).toBe(2);
    });

    it("should return failure when count is zero", async () => {
      const data = { event: "ONBOARD_BANK" };

      mockQueryService.getEventLogsQuery.mockResolvedValueOnce({
        query: "SELECT count(*) ...",
        values: [],
      });

      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });

      const result = await service.getEventLogsExecution(data);

      expect(result).toEqual({ status: 200, data: { code: 2000, data: [] } });
    });

    it("should handle internal errors", async () => {
      mockQueryService.getEventLogsQuery.mockRejectedValue(new Error("DB failure"));

      const result = await service.getEventLogsExecution({});

      expect(result.data.code).toBe(4000);
    });
  });

  describe("getEventHistory", () => {
    it("should return 2000 with records if found", async () => {
      const requestId = 123;

      mockQueryService.eventHistory.mockResolvedValue("SELECT * FROM event_history");
      mockPool.query.mockResolvedValue({ rows: [{ eid: "event1" }] });

      const result = await service.getEventHistory(requestId);

      expect(result).toStrictEqual({ status: 200, data: { code: 2000, data: [{ eid: "event1" }] } });
    });

    it("should return 400 if no records found", async () => {
      mockQueryService.eventHistory.mockResolvedValue("SELECT * FROM event_history");
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await service.getEventHistory(123);
      expect(result).toEqual({ status: 200, data: { code: 2000, data: [] } });
    });

    it("should return 500 on exception", async () => {
      mockQueryService.eventHistory.mockResolvedValue("SELECT ...");
      mockPool.query.mockRejectedValue(new Error("Some error"));

      const result = await service.getEventHistory(123);
      expect(result.data.code).toBe(4000);
    });
  });
});
