import { Test, TestingModule } from '@nestjs/testing';
import { WfhlogService } from './wfhlog.service';
import { HttpService } from '@nestjs/axios';
import { queryService } from '../query/query.service';
import { WinstonLoggerService } from '../winstonlogger/winstonlogger.service';

describe('WfhlogService', () => {
  let service: WfhlogService;

  const mockPool = {
    query: jest.fn(),
  };
  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
  };
  const mockHttpService = {
    post: jest.fn(),
  };
  const mockQueryService = {
    getHandlerLog: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WfhlogService,
        { provide: 'DATABASE_POOL', useValue: mockPool },
        { provide: HttpService, useValue: mockHttpService },
        { provide: queryService, useValue: mockQueryService },
        { provide: WinstonLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<WfhlogService>(WfhlogService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHandlerLogDetails', () => {
    it('should return success with data when records exist', async () => {
      const mockQuery = 'SELECT * FROM handler_logs WHERE event_id = $1';
      const mockRows = [{ id: 1, status: 'PROCESSED' }];

      mockQueryService.getHandlerLog.mockResolvedValue(mockQuery);
      mockPool.query.mockResolvedValue({ rows: mockRows });

      const result = await service.getHandlerLogDetails(101);

      expect(mockQueryService.getHandlerLog).toHaveBeenCalled();
      expect(mockPool.query).toHaveBeenCalledWith(mockQuery, [101]);
      expect(result).toEqual({
        status: 200,
        data: {
          code: 2000,
          data: mockRows,
        },
      });
    });

    it('should return success with empty array when no logs are found', async () => {
      mockQueryService.getHandlerLog.mockResolvedValue('SELECT * FROM handler_logs WHERE event_id = $1');
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await service.getHandlerLogDetails(101);

      expect(mockQueryService.getHandlerLog).toHaveBeenCalled();
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM handler_logs WHERE event_id = $1', [101]);
      expect(result).toEqual({
        status: 200,
        data: {
          code: 2000,
          data: [],
        },
      });
    });

    it('should return error with code 400 on query failure', async () => {
      mockQueryService.getHandlerLog.mockResolvedValue('SELECT * FROM handler_logs WHERE event_id = $1');
      mockPool.query.mockRejectedValue(new Error('No handler log present for the given event_id'));

      const result = await service.getHandlerLogDetails(101);

      expect(mockQueryService.getHandlerLog).toHaveBeenCalled();
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM handler_logs WHERE event_id = $1', [101]);
      expect(result.status).toBe(400);
    });
  });
});
