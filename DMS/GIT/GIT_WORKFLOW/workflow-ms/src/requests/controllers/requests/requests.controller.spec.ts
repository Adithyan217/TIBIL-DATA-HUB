import { Test, TestingModule } from "@nestjs/testing";
import { RequestsController } from "./requests.controller";
import { wfEventsService } from "../../services/wfevents/wfevents.service";
import { wfAgentService } from "../../services/wfagent/wfagent.service";
import { wfHandlerService } from "../../services/wfhandler/wfhandler.service";
import { Wrequest } from "../../interfaces/request.dto";
import { Response } from "express";

describe("RequestsController", () => {
  let controller: RequestsController;
  let wfeMock: jest.Mocked<wfEventsService>;
  let wfaMock: jest.Mocked<wfAgentService>;
  let wfhMock: jest.Mocked<wfHandlerService>;

  // Create a complete mock for the Response object
  const mockResponse = (): Response =>
    ({
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      // You can add other necessary mock methods here
      redirect: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      sendStatus: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
      // Add any additional methods you expect to use
    }) as unknown as Response; // Cast to Response type
  beforeEach(async () => {
    wfeMock = {
      addRequests: jest.fn(),
    } as unknown as jest.Mocked<wfEventsService>;

    wfaMock = {
      readNewEvent: jest.fn(),
    } as unknown as jest.Mocked<wfAgentService>;

    wfhMock = {
      eventProcessor: jest.fn(),
    } as unknown as jest.Mocked<wfHandlerService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [
        { provide: wfEventsService, useValue: wfeMock },
        { provide: wfAgentService, useValue: wfaMock },
        { provide: wfHandlerService, useValue: wfhMock },
      ],
    }).compile();

    controller = module.get<RequestsController>(RequestsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("ping", () => {
    it('should return "OK"', async () => {
      const res = mockResponse();
      await controller.ping(res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith("OK");
    });
  });

  describe("createRequests", () => {
    it("should successfully create a request", async () => {
      const res = mockResponse();
      const mockDetails: Wrequest = {
        event: "ALLOCATE_TO_MERCHANT",
        details: [{ mid: 123, did: 45 }],
      };
      wfeMock.addRequests.mockResolvedValue({
        code: 200,
        message: "Request added successfully",
      });

      await controller.createRequests(mockDetails, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        code: 200,
        message: "Request added successfully",
      });
    });

    it("should handle errors when creating a request", async () => {
      const res = mockResponse();
      const mockDetails: Wrequest = {
        event: "ALLOCATE_TO_MERCHANT",
        details: [{ mid: 123, did: 45 }],
      };
      wfeMock.addRequests.mockRejectedValue(new Error("Some error"));

      await controller.createRequests(mockDetails, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 500,
        message: "Unable to create a record",
      });
    });
  });

  describe("invokeWfAgent", () => {
    it("should successfully invoke WF agent", async () => {
      const res = mockResponse();
      const mockDetails = { event_id: 1 };
      wfaMock.readNewEvent.mockResolvedValue({
        code: 200,
        message: "Event processed successfully",
      });

      await controller.invokeWfAgent(mockDetails, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        code: 200,
        message: "Event processed successfully",
      });
    });

    it("should handle errors when invoking WF agent", async () => {
      const res = mockResponse();
      const mockDetails = { event_id: 1 };
      wfaMock.readNewEvent.mockRejectedValue(new Error("Some error"));

      await controller.invokeWfAgent(mockDetails, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 500,
        message: "Unable to create a record",
      });
    });
  });

  // describe('triggerHandler', () => {
  //   it('should successfully trigger the handler', async () => {
  //     const res = mockResponse();
  //     const mockEvent = { mid: 123, did: 45 }; // Example event structure
  //     wfhMock.eventProcessor.mockResolvedValue({ code: 200, message: 'Handler triggered successfully' });

  //     await controller.triggerHandler(mockEvent, res);

  //     expect(res.status).toHaveBeenCalledWith(200);
  //     expect(res.send).toHaveBeenCalledWith({ code: 200, message: 'Handler triggered successfully' });
  //   });

  //   it('should handle errors when triggering the handler', async () => {
  //     const res = mockResponse();
  //     const mockEvent = { mid: 123, did: 45 };
  //     wfhMock.eventProcessor.mockRejectedValue(new Error('Some error'));

  //     await controller.triggerHandler(mockEvent, res);

  //     expect(res.status).toHaveBeenCalledWith(500);
  //     expect(res.json).toHaveBeenCalledWith({
  //       status: 500,
  //       message: 'Unable to trigger handler',
  //     });
  //   });
  // });
});
