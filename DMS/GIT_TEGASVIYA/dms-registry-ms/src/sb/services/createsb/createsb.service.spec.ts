import { Test, TestingModule } from '@nestjs/testing';
import { createSbService } from './createsb.service';
import { QueryService } from '../query/query.service';
import { Pool } from 'pg';
import { sbMessage } from '../../../enums/sb.enums';
import { message } from '../../../enums/message';
import { sb } from '../../interfaces/sb.interface';
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";

describe('createSbService', () => {
  let service: createSbService;
  let pool: Pool;
  let queryService: QueryService;

  const mockPool = {
    query: jest.fn(),
  };

  const mockQueryService = {
    validateAndInsertSb: jest.fn(),
  };
    const mockLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
    };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
                                                                   providers: [
                                                                     createSbService,
                                                                     { provide: 'DATABASE_POOL', useValue: mockPool },
                                                                     { provide: QueryService, useValue: mockQueryService },
                                                                       { provide: WinstonLoggerService, useValue: mockLogger },
                                                                   ],
                                                                 }).compile();

    service = module.get<createSbService>(createSbService);
    pool = module.get<Pool>('DATABASE_POOL');
    queryService = module.get<QueryService>(QueryService);

    jest.clearAllMocks();
  });

  describe('createSb', () => {
    const mockSbInput: sb = {
      event: 'ALLOCATE_TO_BRANCH',
      event_by: 'admin',
      eid: 12345,
      edetails: [
        {
          row_id: 1,
          vpa_id: 'vpa-001',
          device_id: 'dev-001',
          bank_id: 'bank-001',
          branch_id: 'branch-001',
          merchant_id: 'merchant-001',
        },
      ],
    };

    it('should return success response with formatted rows', async () => {
      const mockTransformed = await service.transformToSbSchema(mockSbInput);
      const mockInsertQuery = 'INSERT INTO sb_table ...';

      mockQueryService.validateAndInsertSb.mockReturnValueOnce(mockInsertQuery);
      mockPool.query.mockResolvedValueOnce({
                                             rows: [
                                               { status: 1, row_id: 1 },
                                               { status: 0, row_id: 2 },
                                             ],
                                           });

      const result = await service.createSb(mockSbInput);

      expect(queryService.validateAndInsertSb).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalledWith(mockInsertQuery, [
        mockTransformed.rowIds,
        mockTransformed.event,
        mockTransformed.vpa,
        mockTransformed.device_id,
        mockTransformed.bank_id,
        mockTransformed.branch_id,
        mockTransformed.merchant_id,
        mockTransformed.eventBys,
        mockTransformed.eids,
      ]);

      expect(result).toEqual({
                               code: sbMessage.SUCCESS_CODE,
                               message: sbMessage.SUCCESS_MESSAGE,
                               edata: {
                                 headers: ['status', 'row_id'],
                                 values: [[1, 1], [0, 2]],
                                 status: [2, 1, 1],
                               },
                             });
    });

    it('should return server error on exception', async () => {
      mockQueryService.validateAndInsertSb.mockReturnValueOnce('INSERT INTO ...');
      mockPool.query.mockRejectedValueOnce(new Error('DB Error'));

      const result = await service.createSb(mockSbInput);
      expect(result).toEqual(message.ERROR.SERVER_ERROR);
    });
  });

  describe('transformToSbSchema', () => {
    it('should transform sb input into expected schema', async () => {
      const input: sb = {
        event: 'ALLOCATE_TO_BRANCH',
        event_by: 'admin',
        eid: 999,
        edetails: [
          {
            row_id: 1,
            vpa_id: 'vpa-abc',
            device_id: 'dev-abc',
            bank_id: 'bank-abc',
            branch_id: 'branch-abc',
            merchant_id: 'merchant-abc',
          },
        ],
      };

      const transformed = await service.transformToSbSchema(input);

      expect(transformed).toEqual({
                                    rowIds: [1],
                                    event: 'ALLOCATE_TO_BRANCH',
                                    vpa: ['vpa-abc'],
                                    device_id: ['dev-abc'],
                                    bank_id: ['bank-abc'],
                                    branch_id: ['branch-abc'],
                                    merchant_id: ['merchant-abc'],
                                    eventBys: ['admin'],
                                    eids: [999],
                                  });
    });

    it('should handle empty edetails array', async () => {
      const input: any = {
        event: 'SOME_EVENT',
        event_by: 'user',
        eid: 101,
        edetails: [],
      };

      const transformed = await service.transformToSbSchema(input);

      expect(transformed).toEqual({
                                    rowIds: [],
                                    event: 'SOME_EVENT',
                                    vpa: [],
                                    device_id: [],
                                    bank_id: [],
                                    branch_id: [],
                                    merchant_id: [],
                                    eventBys: [],
                                    eids: [],
                                  });
    });
  });
});
