import { Test, TestingModule } from '@nestjs/testing';
import { WfalogService } from './wfalog.service';
import { HttpService } from '@nestjs/axios';
import { queryService } from '../query/query.service';
import { WinstonLoggerService } from "../winstonlogger/winstonlogger.service";
import { CODE } from "../enum/common_messages.enum";

describe('WfalogService', () => {
  let service: WfalogService;

  const mockPool = {
    query: jest.fn(),
  };
  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
  };
  const mockQueryService = {
    getActionLog: jest.fn(),
    getActionType: jest.fn(),
  };
  const mockHttpService = {
    post: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WfalogService,
        { provide: 'DATABASE_POOL', useValue: mockPool },
        { provide: HttpService, useValue: mockHttpService },
        { provide: queryService, useValue: mockQueryService },
        { provide: WinstonLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<WfalogService>(WfalogService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getActionLogDetails', () => {
    it('should return 200 with rows if records exist', async () => {
      const mockRows = [{ lid: 1, status: 'PROCESSING' }];
      mockQueryService.getActionLog.mockResolvedValue('SELECT * FROM wfa_log');
      mockPool.query.mockResolvedValue({ rows: mockRows });

      const result = await service.getActionLogDetails(123);

      expect(result.status).toBe(200);
      expect(result.data.code).toBe(CODE.SUCCESS);
      expect(result.data.data).toEqual(mockRows);
    });

    it('should return 200 with empty array if no records found', async () => {
      mockQueryService.getActionLog.mockResolvedValue('SELECT * FROM wfa_log');
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await service.getActionLogDetails(123);

      expect(result.status).toBe(200);
      expect(result.data.code).toBe(CODE.SUCCESS);
      expect(result.data.data).toEqual([]);
    });

    it('should return 400 if there is an error', async () => {
      mockQueryService.getActionLog.mockResolvedValue('SELECT * FROM wfa_log');
      mockPool.query.mockRejectedValue(new Error('DB error'));

      const result = await service.getActionLogDetails(123);

      expect(result.status).toBe(400);
      expect(result.data.code).toBe(CODE.ERROR);
      expect(result.data.message).toMatch(/db error/i);
    });
  });

  describe('getActionTypes', () => {
    it('should return 200 and transformed ecodes if records exist', async () => {
      const mockQuery = { query: 'SELECT ...', values: ['admin'] };
      const mockRows = [{ vcode: 'ACTION_CREATE' }, { vcode: 'ACTION_DELETE' }];

      mockQueryService.getActionType.mockResolvedValue(mockQuery);
      mockPool.query.mockResolvedValue({ rows: mockRows, rowCount: 2 });

      const result = await service.getActionTypes('admin');

      expect(result.status).toBe(200);
      expect(result.data.code).toBe(CODE.SUCCESS);
      expect(result.data.count).toBe(2);
      expect(result.data.ecodes).toEqual(['ACTION_CREATE', 'ACTION_DELETE']);
    });

    it('should return 200 with empty array if no records exist', async () => {
      mockQueryService.getActionType.mockResolvedValue({ query: 'SELECT ...', values: ['admin'] });
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await service.getActionTypes('admin');

      expect(result.status).toBe(200);
      expect(result.data.code).toBe(CODE.SUCCESS);
      expect(result.data.data).toEqual([]);
    });

    it('should return 400 if there is an error', async () => {
      mockQueryService.getActionType.mockResolvedValue({ query: 'SELECT ...', values: ['admin'] });
      mockPool.query.mockRejectedValue(new Error('DB error'));

      const result = await service.getActionTypes('admin');

      expect(result.status).toBe(400);
      expect(result.data.code).toBe(CODE.ERROR);
      expect(result.data.message).toMatch(/db error/i);
    });
  });
});
