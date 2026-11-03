import { Test, TestingModule } from '@nestjs/testing';
import { onboardVpaService } from './onboardvpa.services';
import { QueryService } from '../query/query.service';
import { Pool } from 'pg';
import { vpaMessage } from '../../../enums/vpa.enums';
import { message } from '../../../enums/message';
import { vpa } from '../../interfaces/vpa.interface';
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";

describe('onboardVpaService', () => {
    let service: onboardVpaService;
    let pool: Pool;
    let qs: QueryService;

    const mockPool = {
        query: jest.fn(),
    };

    const mockQueryService = {
        validateAndInsertVpa: jest.fn(),
    };
    const mockLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
    };
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
                                                                         providers: [
                                                                             onboardVpaService,
                                                                             { provide: 'DATABASE_POOL', useValue: mockPool },
                                                                             { provide: QueryService, useValue: mockQueryService },
                                                                             { provide: WinstonLoggerService, useValue: mockLogger },
                                                                         ],
                                                                     }).compile();

        service = module.get<onboardVpaService>(onboardVpaService);
        pool = module.get<Pool>('DATABASE_POOL');
        qs = module.get<QueryService>(QueryService);

        jest.clearAllMocks();
    });

    describe('createvpa', () => {
        const mockVpaData: vpa = {
            event_by: 'admin',
            eid: 999,
            event: 'admin',
            edetails: [
                {
                    row_id: 1,
                    vpa: 'test@upi',
                    device_id: 'dev-001',
                    bank_id: 'bank-001',
                },
            ],
        };

        it('should return success response with inserted data', async () => {
            const mockTransformed = await service.transformToVpaSchema(mockVpaData);
            const insertQuery = 'INSERT INTO vpa_table ...';

            mockQueryService.validateAndInsertVpa.mockReturnValueOnce(insertQuery);
            mockPool.query.mockResolvedValueOnce({
                                                     rows: [
                                                         { status: 1, row_id: 1 },
                                                         { status: 0, row_id: 2 },
                                                     ],
                                                 });

            const result = await service.createvpa(mockVpaData);

            expect(qs.validateAndInsertVpa).toHaveBeenCalled();
            expect(pool.query).toHaveBeenCalledWith(insertQuery, [
                mockTransformed.rowIds,
                mockTransformed.vpas,
                mockTransformed.deviceNames,
                mockTransformed.bankNames,
                mockTransformed.eventBys,
                mockTransformed.eids,
            ]);

            expect(result).toEqual({
                                       code: vpaMessage.SUCCESS_CODE,
                                       message: vpaMessage.SUCCESS_MESSAGE,
                                       edata: {
                                           headers: ['status', 'row_id'],
                                           values: [[1, 1], [0, 2]],
                                           status: [2, 1, 1],
                                       },
                                   });
        });

        it('should return server error on exception', async () => {
            mockQueryService.validateAndInsertVpa.mockReturnValueOnce('INSERT INTO ...');
            mockPool.query.mockRejectedValueOnce(new Error('DB failure'));

            const result = await service.createvpa(mockVpaData);

            expect(result).toEqual(message.ERROR.SERVER_ERROR);
        });
    });

    describe('transformToVpaSchema', () => {
        it('should transform input data correctly', async () => {
            const input: vpa = {
                event_by: 'user',
                eid: 456,
                event:"dfd",
                edetails: [
                    {
                        row_id: 1,
                        vpa: 'abc@upi',
                        bank_id: 'bank-123',
                        device_id: 'dev-123',
                    },
                ],
            };

            const result = await service.transformToVpaSchema(input);

            expect(result).toEqual({
                                       rowIds: [1],
                                       vpas: ['abc@upi'],
                                       bankNames: ['bank-123'],
                                       deviceNames: ['dev-123'],
                                       eventBys: ['user'],
                                       eids: [456],
                                   });
        });

        it('should return empty arrays for empty edetails', async () => {
            const input: any = {
                event_by: 'user',
                eid: 456,
                edetails: [],
            };

            const result = await service.transformToVpaSchema(input);

            expect(result).toEqual({
                                       rowIds: [],
                                       vpas: [],
                                       bankNames: [],
                                       deviceNames: [],
                                       eventBys: [],
                                       eids: [],
                                   });
        });
    });
});
