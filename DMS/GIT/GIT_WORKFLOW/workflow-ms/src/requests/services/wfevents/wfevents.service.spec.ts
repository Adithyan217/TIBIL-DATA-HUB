import { Test, TestingModule } from "@nestjs/testing";
import { wfEventsService } from "./wfevents.service";
import { queryService } from "../query/query.service";
import { HttpService } from "@nestjs/axios";
import { SchemaValidationService } from "../utils/validator.service";
import { WrequestSchema } from "src/requests/schema/request";
import { Wrequest } from "src/requests/interfaces/request.dto"; // Ensure this is imported

describe("wfEventsService", () => {
  let service: wfEventsService;

  const mockPool = {
    query: jest.fn(),
  };

  const mockValidationService = {
    validate: jest.fn(),
  };

  const mockQueryService = {
    addReq: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        wfEventsService,
        { provide: "DATABASE_POOL", useValue: mockPool },
        { provide: SchemaValidationService, useValue: mockValidationService },
        { provide: queryService, useValue: mockQueryService },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<wfEventsService>(wfEventsService);
  });

  describe("addRequests", () => {
    it("should add a request successfully", async () => {
      const mockDetails: Wrequest = {
        event: "ALLOCATE_TO_MERCHANT",
        details: [
          {
            mid: 123,
            did: 45,
          },
        ],
      };
      mockValidationService.validate.mockReturnValue(mockDetails); // Return valid data for validation
      mockPool.query.mockResolvedValueOnce({ rows: [{ eid: 1 }] });

      const result = await service.addRequests(mockDetails);

      expect(mockValidationService.validate).toHaveBeenCalledWith(
        WrequestSchema,
        mockDetails,
      );
      expect(mockQueryService.addReq).toHaveBeenCalled();
      expect(result).toEqual({
        code: 200,
        message: "Request added successfully",
      });
    });

    it("should return error if the event is empty", async () => {
      const mockDetails: Wrequest = {
        event: "", // Empty event
        details: [
          {
            mid: 123,
            did: 45,
          },
        ],
      };
      mockValidationService.validate.mockReturnValue(false);
      const result = await service.addRequests(mockDetails);
      expect(result).toEqual({ code: 400, message: "Unable to add request" });
    });
    it("should return error if mid is an empty string", async () => {
      const mockDetails: Wrequest = {
        event: "ALLOCATED_TO_MERCHANT",
        details: [
          {
            mid: "",
            did: 45,
          },
        ],
      };
      mockValidationService.validate.mockReturnValue(false);
      const result = await service.addRequests(mockDetails);
      expect(result).toEqual({ code: 400, message: "Unable to add request" });
    });

    it("should return error if did is an empty string", async () => {
      const mockDetails: Wrequest = {
        event: "ALLOCATED_TO_MERCHANT",
        details: [
          {
            mid: 123,
            did: "", // Empty did
          },
        ],
      };
      mockValidationService.validate.mockReturnValue(false);
      const result = await service.addRequests(mockDetails);
      expect(result).toEqual({ code: 400, message: "Unable to add request" });
    });

    it("should return error if mid is a non-numeric string", async () => {
      const mockDetails: Wrequest = {
        event: "",
        details: [
          {
            mid: "abc", // Non-numeric mid
            did: "pqr",
          },
        ],
      };
      mockValidationService.validate.mockReturnValue(false);
      const result = await service.addRequests(mockDetails);
      expect(result).toEqual({ code: 400, message: "Unable to add request" });
    });

    it("should return error if did is a non-numeric string", async () => {
      const mockDetails: Wrequest = {
        event: "ALLOCATED_TO_MERCHANT",
        details: [
          {
            mid: "abc",
            did: "pqr", // Non-numeric did
          },
        ],
      };
      mockValidationService.validate.mockReturnValue(false);
      const result = await service.addRequests(mockDetails);
      expect(result).toEqual({ code: 400, message: "Unable to add request" });
    });
    it("should return error if details is an empty array", async () => {
      const mockDetails: Wrequest = {
        event: "ALLOCATED_TO_MERCHANT",
        details: [], // Empty details
      };
      mockValidationService.validate.mockReturnValue(false);

      const result = await service.addRequests(mockDetails);

      expect(result).toEqual({ code: 400, message: "Unable to add request" });
    });
    it("should return error if details property is missing", async () => {
      const mockDetails = {
        event: "ALLOCATED_TO_MERCHANT",
      };
      mockValidationService.validate.mockReturnValue(false);

      const result = await service.addRequests(mockDetails as any);

      expect(result).toEqual({ code: 400, message: "Unable to add request" });
    });
    it("should return error if empty body passing", async () => {
      const mockDetails = {};
      mockValidationService.validate.mockReturnValue(false);

      const result = await service.addRequests(mockDetails as any);

      expect(result).toEqual({ code: 400, message: "Unable to add request" });
    });
  });
});
