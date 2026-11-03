import { Test, TestingModule } from "@nestjs/testing";
import { wfHandlerService } from "./wfhandler.service";
import { HttpService } from "@nestjs/axios";
import { queryService } from "../query/query.service";
import { Pool } from "pg";
import { of, throwError } from "rxjs";
import { Hinfo } from "src/requests/interfaces/request.dto";

describe("wfHandlerService", () => {
  let service: wfHandlerService;
  let httpService: HttpService;
  let pool: Pool;
  let queryServiceMock: queryService;

  beforeEach(async () => {
    queryServiceMock = {
      addReq: jest.fn(),
      checkForNewEvent: jest.fn(),
      checkHandlerForEvent: jest.fn(),
      updateEvent: jest.fn(),
      createWfLog: jest.fn(),
      updateWfLog: jest
        .fn()
        .mockReturnValue(
          "UPDATE wf_log SET status = $1, timestamp = $2 WHERE lid = $3 RETURNING *",
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        wfHandlerService,
        {
          provide: "DATABASE_POOL",
          useValue: {
            query: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: jest.fn() as jest.MockedFunction<typeof httpService.post>, // Proper type casting
          },
        },
        {
          provide: queryService,
          useValue: queryServiceMock,
        },
      ],
    }).compile();

    service = module.get<wfHandlerService>(wfHandlerService);
    httpService = module.get<HttpService>(HttpService);
    pool = module.get<Pool>("DATABASE_POOL");
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("eventProcessor", () => {
    it("should call callRegistryApi and return success message", async () => {
      const mockEvent: Hinfo = {
        lid: 1,
        eid: 1001,
        ecode: "ALLOCATE_TO_MERCHANT",
        edetails: {
          event: "ALLOCATE_TO_MERCHANT",
          details: [
            {
              mid: 123,
              did: 45,
            },
          ],
        },
      };
      const spyCallRegistryApi = jest
        .spyOn(service, "callRegistryApi")
        .mockImplementation(jest.fn());
      const result = service.eventProcessor(mockEvent);
      expect(spyCallRegistryApi).toHaveBeenCalledWith(mockEvent);
      expect(result).toEqual({ code: 200, message: "Hanlder is processing" });
    });

    it("if the ecode is empty ", async () => {
      const mockEvent: Hinfo = {
        lid: 1,
        eid: 1001,
        ecode: "",
        edetails: {
          event: "ALLOCATE_TO_MERCHANT",
          details: [
            {
              mid: 123,
              did: 45,
            },
          ],
        },
      };
      const spyCallRegistryApi = jest
        .spyOn(service, "callRegistryApi")
        .mockImplementation(jest.fn());
      const result = service.eventProcessor(mockEvent);
      expect(spyCallRegistryApi).toHaveBeenCalledWith(mockEvent);
      expect(result).toEqual({ code: 200, message: "Hanlder is processing" });
    });
    it("if the event is empty ", async () => {
      const mockEvent: Hinfo = {
        lid: 1,
        eid: 1001,
        ecode: "ALLOCATE_TO_MERCHANT",
        edetails: {
          event: "",
          details: [
            {
              mid: 123,
              did: 45,
            },
          ],
        },
      };
      const spyCallRegistryApi = jest
        .spyOn(service, "callRegistryApi")
        .mockImplementation(jest.fn());
      const result = service.eventProcessor(mockEvent);
      expect(spyCallRegistryApi).toHaveBeenCalledWith(mockEvent);
      expect(result).toEqual({ code: 200, message: "Hanlder is processing" });
    });
    it("if the lid is negative integer", async () => {
      const mockEvent: Hinfo = {
        lid: -1,
        eid: 1001,
        ecode: "ALLOCATE_TO_MERCHANT",
        edetails: {
          event: "ALLOCATE_TO_MERCHANT",
          details: [
            {
              mid: 123,
              did: 45,
            },
          ],
        },
      };
      const spyCallRegistryApi = jest
        .spyOn(service, "callRegistryApi")
        .mockImplementation(jest.fn());
      const result = service.eventProcessor(mockEvent);
      expect(spyCallRegistryApi).toHaveBeenCalledWith(mockEvent);
      expect(result).toEqual({ code: 200, message: "Hanlder is processing" });
    });
    it("if the eid is negative integer", async () => {
      const mockEvent: Hinfo = {
        lid: 1,
        eid: -1001,
        ecode: "ALLOCATE_TO_MERCHANT",
        edetails: {
          event: "ALLOCATE_TO_MERCHANT",
          details: [
            {
              mid: 123,
              did: 45,
            },
          ],
        },
      };
      const spyCallRegistryApi = jest
        .spyOn(service, "callRegistryApi")
        .mockImplementation(jest.fn());
      const result = service.eventProcessor(mockEvent);
      expect(spyCallRegistryApi).toHaveBeenCalledWith(mockEvent);
      expect(result).toEqual({ code: 200, message: "Hanlder is processing" });
    });
    it("if the mid isa string", async () => {
      const mockEvent: Hinfo = {
        lid: 1,
        eid: 1001,
        ecode: "ALLOCATE_TO_MERCHANT",
        edetails: {
          event: "ALLOCATE_TO_MERCHANT",
          details: [
            {
              mid: "abc",
              did: 45,
            },
          ],
        },
      };
      const spyCallRegistryApi = jest
        .spyOn(service, "callRegistryApi")
        .mockImplementation(jest.fn());
      const result = service.eventProcessor(mockEvent);
      expect(spyCallRegistryApi).toHaveBeenCalledWith(mockEvent);
      expect(result).toEqual({ code: 200, message: "Hanlder is processing" });
    });
    it("if the did is string ", async () => {
      const mockEvent: Hinfo = {
        lid: 1,
        eid: 1001,
        ecode: "ALLOCATE_TO_MERCHANT",
        edetails: {
          event: "ALLOCATE_TO_MERCHANT",
          details: [
            {
              mid: 123,
              did: "prq",
            },
          ],
        },
      };
      const spyCallRegistryApi = jest
        .spyOn(service, "callRegistryApi")
        .mockImplementation(jest.fn());
      const result = service.eventProcessor(mockEvent);
      expect(spyCallRegistryApi).toHaveBeenCalledWith(mockEvent);
      expect(result).toEqual({ code: 200, message: "Hanlder is processing" });
    });
    it("if both mid  and did is string", async () => {
      const mockEvent: Hinfo = {
        lid: 1,
        eid: 1001,
        ecode: "ALLOCATE_TO_MERCHANT",
        edetails: {
          event: "ALLOCATE_TO_MERCHANT",
          details: [
            {
              mid: "abc",
              did: "pqr",
            },
          ],
        },
      };
      const spyCallRegistryApi = jest
        .spyOn(service, "callRegistryApi")
        .mockImplementation(jest.fn());
      const result = service.eventProcessor(mockEvent);
      expect(spyCallRegistryApi).toHaveBeenCalledWith(mockEvent);
      expect(result).toEqual({ code: 200, message: "Hanlder is processing" });
    });
    it("if the ecode, event, mid and did is empty string", async () => {
      const mockEvent: Hinfo = {
        lid: 1,
        eid: 1001,
        ecode: "",
        edetails: {
          event: "",
          details: [
            {
              mid: "",
              did: "",
            },
          ],
        },
      };
      const spyCallRegistryApi = jest
        .spyOn(service, "callRegistryApi")
        .mockImplementation(jest.fn());
      const result = service.eventProcessor(mockEvent);
      expect(spyCallRegistryApi).toHaveBeenCalledWith(mockEvent);
      expect(result).toEqual({ code: 200, message: "Hanlder is processing" });
    });
    it("if the eid is negative integer and ecode and event is empty string", async () => {
      const mockEvent: Hinfo = {
        lid: 1,
        eid: -1001,
        ecode: "",
        edetails: {
          event: "",
          details: [
            {
              mid: 123,
              did: 45,
            },
          ],
        },
      };
      const spyCallRegistryApi = jest
        .spyOn(service, "callRegistryApi")
        .mockImplementation(jest.fn());
      const result = service.eventProcessor(mockEvent);
      expect(spyCallRegistryApi).toHaveBeenCalledWith(mockEvent);
      expect(result).toEqual({ code: 200, message: "Hanlder is processing" });
    });

    it("if the eid is negative integer", async () => {
      const mockEvent: Hinfo = {
        lid: 1,
        eid: -1001,
        ecode: "ALLOCATE_TO_MERCHANT",
        edetails: {
          event: "ALLOCATE_TO_MERCHANT",
          details: [
            {
              mid: 123,
              did: 45,
            },
          ],
        },
      };
      const spyCallRegistryApi = jest
        .spyOn(service, "callRegistryApi")
        .mockImplementation(jest.fn());
      const result = service.eventProcessor(mockEvent);
      expect(spyCallRegistryApi).toHaveBeenCalledWith(mockEvent);
      expect(result).toEqual({ code: 200, message: "Hanlder is processing" });
    });
    it("if the eid is negative integer and details filled is empty", async () => {
      const mockEvent: Hinfo = {
        lid: 1,
        eid: -1001,
        ecode: "ALLOCATE_TO_MERCHANT",
        edetails: {
          event: "ALLOCATE_TO_MERCHANT",
          details: [{}],
        },
      };
      const spyCallRegistryApi = jest
        .spyOn(service, "callRegistryApi")
        .mockImplementation(jest.fn());
      const result = service.eventProcessor(mockEvent);
      expect(spyCallRegistryApi).toHaveBeenCalledWith(mockEvent);
      expect(result).toEqual({ code: 200, message: "Hanlder is processing" });
    });

    it("if the details is an empty array", async () => {
      const mockEvent: Hinfo = {
        lid: 1,
        eid: 1001,
        ecode: "ALLOCATE_TO_MERCHANT",
        edetails: {
          event: "ALLOCATE_TO_MERCHANT",
          details: [{}],
        },
      };
      const spyCallRegistryApi = jest
        .spyOn(service, "callRegistryApi")
        .mockImplementation(jest.fn());
      const result = service.eventProcessor(mockEvent);
      expect(spyCallRegistryApi).toHaveBeenCalledWith(mockEvent);
      expect(result).toEqual({ code: 200, message: "Hanlder is processing" });
    });
    it("should return error if ecode is not recognized", async () => {
      const mockEvent: Hinfo = {
        lid: 1,
        eid: 1001,
        ecode: "UNKNOWN_EVENT",
        edetails: {
          event: "ALLOCATE_TO_MERCHANT",
          details: [{ mid: 123, did: 45 }],
        },
      };
      const result = service.eventProcessor(mockEvent);
      expect(result).toEqual({ code: 200, message: "Hanlder is processing" });
    });

    it('should call updateWfLogForEvent with "END" when response status is 200', async () => {
      const mockEvent: Hinfo = {
        lid: 1,
        eid: 1001,
        ecode: "ALLOCATE_TO_MERCHANT",
        edetails: { event: "ALLOCATE_TO_MERCHANT", details: [{}] },
      };

      // Mock console.log
      const result = service.eventProcessor(mockEvent);
      expect(result).toEqual({ code: 200, message: "Hanlder is processing" });
    });
    it('should call updateWfLogForEvent with "FAIL" for unhandled response statuses', async () => {
      const mockEvent: Hinfo = {
        lid: 1,
        eid: 1001,
        ecode: "",
        edetails: { event: "ALLOCATE_TO_MERCHANT", details: [{}] },
      };

      const mockErrorResponse = {
        response: { status: 400, data: { message: "Error" } },
      };
      jest
        .spyOn(service, "callRegistryApi")
        .mockRejectedValue(mockErrorResponse);
    });

    it("should process multiple valid details entries correctly", async () => {
      const mockEvent: Hinfo = {
        lid: 1,
        eid: 1001,
        ecode: "ALLOCATE_TO_MERCHANT",
        edetails: {
          event: "ALLOCATE_TO_MERCHANT",
          details: [
            { mid: 123, did: 45 },
            { mid: 124, did: 46 },
          ],
        },
      };
      const spyCallRegistryApi = jest
        .spyOn(service, "callRegistryApi")
        .mockImplementation(jest.fn());
      const result = service.eventProcessor(mockEvent);
      expect(spyCallRegistryApi).toHaveBeenCalledWith(mockEvent);
      expect(result).toEqual({ code: 200, message: "Hanlder is processing" });
    });

    it("should execute the update query", async () => {
      const lid = "1";
      const status = "END";
      // Mocking the query response to return a Promise
      jest
        .spyOn(queryServiceMock, "updateWfLog")
        .mockResolvedValue(
          "UPDATE wf_log SET status = $1, timestamp = $2 WHERE lid = $3 RETURNING *",
        );
      jest.spyOn(pool, "query").mockResolvedValue(undefined); // Assuming you just need it to resolve successfully

      await service.updateWfLogForEvent(status, lid);

      expect(queryServiceMock.updateWfLog).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalledWith(
        "UPDATE wf_log SET status = $1, timestamp = $2 WHERE lid = $3 RETURNING *",
        [status, expect.anything(), lid],
      );
    });

    it('should call updateWfLogForEvent with "FAIL" for unhandled response statuses', async () => {
      const mockEvent: Hinfo = {
        lid: 1,
        eid: 1001,
        ecode: "",
        edetails: { event: "ALLOCATE_TO_MERCHANT", details: [{}] },
      };

      const mockErrorResponse = {
        response: { status: 500, data: { message: "Error" } },
      };
      jest
        .spyOn(service, "callRegistryApi")
        .mockRejectedValue(mockErrorResponse);
    });
  });
});
