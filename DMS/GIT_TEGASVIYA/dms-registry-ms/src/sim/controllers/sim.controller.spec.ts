import { Test, TestingModule } from '@nestjs/testing';
import { simRequestsController } from './sim.controller';
import { createSimRequests } from '../services/createsimrequests/createsimrequests.services';
import { WinstonLoggerService } from '../../common/service/winstonlogger/winstonlogger.service';

describe('simRequestsController', () => {
  let controller: simRequestsController;
  let service: createSimRequests;
  let logger: WinstonLoggerService;

  const mockService = {
    createSimRequests: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  const req = {
    method: 'GET',
    url: '/registry/device-issues/ping',
  };

  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
    json: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [simRequestsController],
      providers: [
        { provide: createSimRequests, useValue: mockService },
        { provide: WinstonLoggerService, useValue: mockLogger },
      ],
    }).compile();

    controller = module.get<simRequestsController>(simRequestsController);
    service = module.get<createSimRequests>(createSimRequests);
    logger = module.get<WinstonLoggerService>(WinstonLoggerService);

    jest.clearAllMocks();
  });

  describe('ping', () => {
    it('should return OK with status 200', async () => {
      await controller.ping(res as any, req as any);

      // Logging is disabled in controller
      // expect(logger.log).toHaveBeenCalledWith('GET /registry/device-issues/ping - Incoming request');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('OK');
    });
  });

  describe('onboardDevices', () => {
    const simRequest = { eid: '123' };

    it('should return 201 with valid response', async () => {
      const result = { code: 200, message: 'Success' };
      mockService.createSimRequests.mockResolvedValue(result);

      req.method = 'POST';
      req.url = '/registry/sim-requests';

      await controller.onboardDevices(simRequest as any, res as any, req as any);

      // Logging is disabled in controller
      // expect(logger.log).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(result);
    });

    it('should return 400 for invalid response', async () => {
      const result = { code: 400, message: 'Invalid data' };
      mockService.createSimRequests.mockResolvedValue(result);

      await controller.onboardDevices(simRequest as any, res as any, req as any);

      // Logging is disabled in controller
      // expect(logger.log).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(result);
    });

    it('should return 500 on error', async () => {
      mockService.createSimRequests.mockRejectedValue(new Error('DB error'));

      await controller.onboardDevices(simRequest as any, res as any, req as any);

      // Logging is disabled in controller
      // expect(logger.error).toHaveBeenCalledWith('POST /registry/sim-requests - DB error');

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 500,
        message: 'Unable to create a record',
      });
    });
  });
});
