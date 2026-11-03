import { Test, TestingModule } from '@nestjs/testing';
import { RoutesService } from './routes.service';
import { RoutesQueryService } from './routes-query/routes-query.service';
import { Pool } from 'pg';
import { commonEnum } from '../../common/enum/common.enum';
import {WinstonLoggerService} from "../../common/service/winstonlogger/winstonlogger.service";

describe('RoutesService', () => {
  let service: RoutesService;
  let pool: Pool;
  let queryService: RoutesQueryService;

  const mockPool = {
    query: jest.fn(),
  };

    const mockLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
    };
  const mockQueryService = {
    getRoutesDeviceAssociation: jest.fn(),
    getRoutesConfig: jest.fn(),
    getRoutes: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
                                                                   providers: [
                                                                     RoutesService,
                                                                     { provide: 'DATABASE_POOL', useValue: mockPool },
                                                                     { provide: RoutesQueryService, useValue: mockQueryService },
                                                                       { provide: WinstonLoggerService, useValue: mockLogger },
                                                                   ],
                                                                 }).compile();

    service = module.get<RoutesService>(RoutesService);
    pool = module.get<Pool>('DATABASE_POOL');
    queryService = module.get<RoutesQueryService>(RoutesQueryService);

    jest.clearAllMocks();
  });

  describe('ExecuteGetDevicesQueryAndReturnResult', () => {
    it('should return success with data', async () => {
      const queryResult = { rows: [{ id: 1 }], rowCount: 1 };
      mockQueryService.getRoutesDeviceAssociation.mockReturnValue({
                                                                    query: 'SELECT * FROM devices WHERE did = $1',
                                                                    values: [123],
                                                                  });
      mockPool.query.mockResolvedValueOnce(queryResult);

      const result = await service.ExecuteGetDevicesQueryAndReturnResult(123);

      expect(result).toEqual({
        status: 200,
        data: {
          code: commonEnum.SUCCESS_CODE,
          data: queryResult.rows,  // assuming `queryResult.rows` contains the actual data like [{ id: 1 }]
        },
      });
      
      expect(mockQueryService.getRoutesDeviceAssociation).toHaveBeenCalledWith(123);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM devices WHERE did = $1', [123]);
    });

    it('should return nothing if no data found', async () => {
      const queryResult = { rows: [], rowCount: 0 };
      mockQueryService.getRoutesDeviceAssociation.mockReturnValue({
                                                                    query: 'SELECT * FROM devices WHERE did = $1',
                                                                    values: [123],
                                                                  });
      mockPool.query.mockResolvedValueOnce(queryResult);

      const result = await service.ExecuteGetDevicesQueryAndReturnResult(123);

      expect(result).toBeUndefined(); // because your code has no else return
    });
  });

  describe('ExecuteRouteConfigQueryAndReturnResult', () => {
    it('should return route config data when found', async () => {
      const rows = [{ config: 'routeA' }];
      mockQueryService.getRoutesConfig.mockReturnValue({
                                                         query: 'SELECT * FROM config',
                                                         values: [],
                                                       });
      mockPool.query.mockResolvedValueOnce({ rows, rowCount: 1 });

      const result = await service.ExecuteRouteConfigQueryAndReturnResult();

      expect(result).toEqual({
        status: 200,
        data: {
          code: commonEnum.SUCCESS_CODE,
          data: rows,  
        },
      });
      
    });

    it('should return no records when none found', async () => {
      mockQueryService.getRoutesConfig.mockReturnValue({
                                                         query: 'SELECT * FROM config',
                                                         values: [],
                                                       });
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await service.ExecuteRouteConfigQueryAndReturnResult();

      expect(result).toEqual({
        status: 200,
        data: {
          code: commonEnum.SUCCESS_CODE,
          data: [],
        },
      });
      
    });
  });

  describe('ExecuteRouteQueryAndReturnResult', () => {
    it('should return routes data when found', async () => {
      const rows = [{ id: 101, route: 'R1' }];
      mockQueryService.getRoutes.mockReturnValue({
                                                   query: 'SELECT * FROM routes WHERE condition = true',
                                                   values: ['active'],
                                                 });
      mockPool.query.mockResolvedValueOnce({ rows, rowCount: 1 });

      const result = await service.ExecuteRouteQueryAndReturnResult({ filter: 'active' });

      expect(result).toEqual({
        status: 200,
        data: {
          code: commonEnum.SUCCESS_CODE,
          data: rows,   // assuming 'rows' is [{ id: 101, route: "R1" }]
        },
      });
      
    });

    it('should return no records found', async () => {
      mockQueryService.getRoutes.mockReturnValue({
                                                   query: 'SELECT * FROM routes WHERE condition = true',
                                                   values: ['inactive'],
                                                 });
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await service.ExecuteRouteQueryAndReturnResult({ filter: 'inactive' });

      expect(result).toEqual({
        status: 200,
        data: {
          code: commonEnum.SUCCESS_CODE,
          data: [],
        },
      });
      
    });
  });
});
