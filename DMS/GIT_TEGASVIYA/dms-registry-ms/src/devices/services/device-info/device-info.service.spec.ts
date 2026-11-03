import { Test, TestingModule } from '@nestjs/testing';
import { DeviceInfoService } from './device-info.service';
import { Pool } from 'pg';
import { QueryService } from '../query/query.services';
import { devicesMessage } from '../../../enums/devices.enums';
import { commonEnum } from '../../../common/enum/common.enum';
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";

describe('DeviceInfoService', () => {
  let service: DeviceInfoService;
  let pool: Pool;
  let qs: QueryService;

  const mockPool = {
    query: jest.fn(),
  };

    const mockLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
    };
  const mockQueryService = {
    getPaymentsForDevices: jest.fn(),
    getTelemetryForDevices: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
                                                                   providers: [
                                                                     DeviceInfoService,
                                                                     { provide: 'DATABASE_POOL', useValue: mockPool },
                                                                     { provide: QueryService, useValue: mockQueryService },
                                                                       { provide: WinstonLoggerService, useValue: mockLogger },
                                                                   ],
                                                                 }).compile();

    service = module.get<DeviceInfoService>(DeviceInfoService);
    pool = module.get<Pool>('DATABASE_POOL');
    qs = module.get<QueryService>(QueryService);

    jest.clearAllMocks();
  });

  const inputParams = {
    dname: 'device-001',
    start_date: '2024-01-01',
    end_date: '2024-01-10',
    limit: 10,
    offset: 0,
    userName: 'admin',
    role: 'superadmin',
  };

  describe('getPaymentsForDevices', () => {
    it('should return payments with count', async () => {
      const countQuery = 'SELECT count(*) FROM payments';
      const paymentsQuery = 'SELECT * FROM payments LIMIT 10 OFFSET 0';

      jest.spyOn(qs, 'getPaymentsForDevices').mockResolvedValueOnce(countQuery);
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: '5' }], rowCount: 1 });

      jest.spyOn(qs, 'getPaymentsForDevices').mockResolvedValueOnce(paymentsQuery);
      mockPool.query.mockResolvedValueOnce({
                                             rows: [{ id: 1, amount: 100 }, { id: 2, amount: 150 }],
                                             rowCount: 2,
                                           });

      const result = await service.getPaymentsForDevices(
          inputParams.dname,
          inputParams.start_date,
          inputParams.end_date,
          inputParams.limit,
          inputParams.offset,
          inputParams.userName,
          inputParams.role
      );
      
      expect(result).toEqual({
        status: 200,
        data: {
          code: commonEnum.SUCCESS_CODE,
          count: 5,
          data: [
            { id: 1, amount: 100 },
            { id: 2, amount: 150 },
          ],
        },
      });
      
    });

    it('should return no records found', async () => {
      jest.spyOn(qs, 'getPaymentsForDevices').mockResolvedValueOnce('count_query');
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 });

      jest.spyOn(qs, 'getPaymentsForDevices').mockResolvedValueOnce('data_query');
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await service.getPaymentsForDevices(
          inputParams.dname,
          inputParams.start_date,
          inputParams.end_date,
          inputParams.limit,
          inputParams.offset,
          inputParams.userName,
          inputParams.role
      );

      expect(result).toEqual({
        status: 200,
        data: {
          code: commonEnum.SUCCESS_CODE,   // 2000
          data: [],
        },
      });
      
    });

    it('should throw error on DB failure', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {}); // suppress console.error

      jest.spyOn(qs, 'getPaymentsForDevices').mockResolvedValue('count_query');
      mockPool.query.mockRejectedValue(new Error('DB error'));

      await expect(
          service.getPaymentsForDevices(
              inputParams.dname,
              inputParams.start_date,
              inputParams.end_date,
              inputParams.limit,
              inputParams.offset,
              inputParams.userName,
              inputParams.role
          )
      ).rejects.toThrow('Internal error');

      jest.restoreAllMocks();
    });
  });

  describe('getTelemetryDetails', () => {
    const data = { deviceId: 'dev123' };

    it('should return telemetry data when available', async () => {
      const queryObj = { query: 'SELECT * FROM telemetry', values: ['dev123'] };
      jest.spyOn(qs, 'getTelemetryForDevices').mockResolvedValueOnce(queryObj);
      mockPool.query.mockResolvedValueOnce({
                                             rows: [{ deviceId: 'dev123', signal: 'strong' }],
                                             rowCount: 1,
                                           });

      const result = await service.getTelemetryDetails(data);

      expect(result).toEqual({
        status: 200,
        data: {
          code: commonEnum.SUCCESS_CODE,
          data: [
            { deviceId: 'dev123', signal: 'strong' }
          ],
        },
      });
      
    });

    it('should return no telemetry data', async () => {
      const queryObj = { query: 'SELECT * FROM telemetry', values: ['dev123'] };
      jest.spyOn(qs, 'getTelemetryForDevices').mockResolvedValueOnce(queryObj);
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await service.getTelemetryDetails(data);

      expect(result).toEqual({
        status: 200,
        data: {
          code: commonEnum.SUCCESS_CODE,
          data: [],  // because it's an empty result
        }
      });
      
    });

    it('should handle DB error and return error message', async () => {
      const queryObj = { query: 'SELECT * FROM telemetry', values: ['dev123'] };
      jest.spyOn(qs, 'getTelemetryForDevices').mockResolvedValueOnce(queryObj);
      mockPool.query.mockRejectedValueOnce(new Error('Telemetry DB error'));

      const result = await service.getTelemetryDetails(data);

      expect(result).toEqual({
        status: 200,
        data: {
          code: commonEnum.FAILURE_CODE,
          message: 'Telemetry DB error'
        }
      });
    });
  });
});
