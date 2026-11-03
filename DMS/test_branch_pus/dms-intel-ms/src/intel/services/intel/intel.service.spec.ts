import { Test, TestingModule } from '@nestjs/testing';
import { IntelService } from './intel.service';
import { Pool } from 'pg';
import { QueryService } from '../query/query.service';
import { ResponseCode, ResponseMessage, CODE, MESSAGE, generateResponse } from '../../enums/response.enum';
import { WinstonLoggerService } from '../../../common/winstonlogger/winstonlogger.service';

describe('IntelService', () => {
    let service: IntelService;
    let pool: any;
    let queryService: QueryService;

    const mockLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
    };

    const mockPool = {
        query: jest.fn(),
    };

    const mockQueryService = {
        getMetricQuery: jest.fn(),
        upermissions: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
                                                                         providers: [
                                                                             IntelService,
                                                                             { provide: 'DATABASE_POOL', useValue: mockPool },
                                                                             { provide: QueryService, useValue: mockQueryService },
                                                                             { provide: WinstonLoggerService, useValue: mockLogger },
                                                                         ],
                                                                     }).compile();

        service = module.get<IntelService>(IntelService);
        pool = module.get('DATABASE_POOL');
        queryService = module.get<QueryService>(QueryService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getMetricsForContext', () => {
        it('should return metrics when query returns rows', async () => {
            const edata = { context: 'banks', role: 'admin', userName: 'user1' };
            const query = { query: 'SELECT * FROM table', values: [] };
            const resultRows = [{ metric: 'value' }];

            mockQueryService.getMetricQuery.mockResolvedValue(query);
            mockPool.query.mockResolvedValue({ rowCount: 1, rows: resultRows });

            const result = await service.getMetricsForContext(edata);
            expect(result).toEqual(generateResponse(200, CODE.SUCCESS, resultRows));
        });

        it('should return NO_RECORDS when no rows found', async () => {
            const edata = { context: 'banks', role: 'admin', userName: 'user1' };
            const query = { query: 'SELECT * FROM table', values: [] };

            mockQueryService.getMetricQuery.mockResolvedValue(query);
            mockPool.query.mockResolvedValue({ rowCount: 0, rows: [] });

            const result = await service.getMetricsForContext(edata);
            expect(result).toEqual(generateResponse(200, CODE.SUCCESS, []));
        });

        it('should handle and log error during DB query', async () => {
            const edata = { context: 'banks', role: 'admin', userName: 'user1' };
            const query = { query: 'SELECT * FROM table', values: [] };
            const dbError = new Error('DB error');

            mockQueryService.getMetricQuery.mockResolvedValue(query);
            mockPool.query.mockRejectedValue(dbError);

            const result = await service.getMetricsForContext(edata);

            expect(result).toEqual({
                                       status: 400,
                                       data: {
                                           code: CODE.ERROR,
                                           message: 'DB error',
                                       },
                                   });

            expect(mockLogger.error).toHaveBeenCalledWith('Error in checkFuncDatasetForEvent:', dbError);
        });

    });

    describe('addUserPermissions', () => {
        it('should return success if rows affected', async () => {
            const body = { userId: 1, permission: 'admin' };
            const query = { query: 'INSERT INTO...', values: [1, 'admin'] };
            const dbResponse = { rowCount: 1, rows: [{ userId: 1, permission: 'admin' }] };

            mockQueryService.upermissions.mockResolvedValue(query);
            mockPool.query.mockResolvedValue(dbResponse);

            const result = await service.addUserPermissions(body);
            expect(result).toEqual( generateResponse(201, CODE.SUCCESS, dbResponse.rows ));
        });

        it('should return FAILURE if no rows affected', async () => {
            const body = { userId: 1, permission: 'admin' };
            const query = { query: 'INSERT INTO...', values: [1, 'admin'] };
            const dbResponse = { rowCount: 0, rows: [] };

            mockQueryService.upermissions.mockResolvedValue(query);
            mockPool.query.mockResolvedValue(dbResponse);

            const result = await service.addUserPermissions(body);
            expect(result).toEqual(generateResponse(200, CODE.INVALID,ResponseMessage.INERTION_FAILURE ));
        });

        it('should catch and log DB error', async () => {
            const body = { userId: 1, permission: 'admin' };
            const query = { query: 'INSERT INTO...', values: [1, 'admin'] };
            const err = new Error('Insert failed');

            mockQueryService.upermissions.mockResolvedValue(query);
            mockPool.query.mockRejectedValue(err);

            const result = await service.addUserPermissions(body);

            expect(result).toEqual({
                                       status: 400,
                                       data: {
                                           code: CODE.ERROR,
                                           message: 'Insert failed'
                                       }
                                   });

            expect(mockLogger.error).toHaveBeenCalledWith('Error in addUserPermissions:', 'Insert failed');
        });

    });
});
