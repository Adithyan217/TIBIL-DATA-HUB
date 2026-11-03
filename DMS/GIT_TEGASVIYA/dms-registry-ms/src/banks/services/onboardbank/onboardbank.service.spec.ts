import { Test, TestingModule } from '@nestjs/testing';
import { onboardBankService } from './onboardbank.service';
import { QueryService } from '../query/query.service';
import { Pool } from 'pg';
import { banksMessage } from '../../../enums/banks.enums';
import { message } from '../../../enums/message';
import { Bank } from '../../interfaces/bank.interface';
import { WinstonLoggerService } from '../../../common/service/winstonlogger/winstonlogger.service';
describe('onboardBankService', () => {
    let service: onboardBankService;
    let qs: QueryService;
    let pool: Pool;

    const mockLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
    };
    const mockPool = {
        query: jest.fn(),
    };

    const mockQueryService = {
        validateAndInsertBanks: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
                                                                         providers: [
                                                                             onboardBankService,
                                                                             { provide: 'DATABASE_POOL', useValue: mockPool },
                                                                             { provide: QueryService, useValue: mockQueryService },
                                                                             { provide: WinstonLoggerService, useValue: mockLogger },
                                                                         ],
                                                                     }).compile();

        service = module.get<onboardBankService>(onboardBankService);
        qs = module.get<QueryService>(QueryService);
        pool = module.get<Pool>('DATABASE_POOL');

        jest.clearAllMocks();
    });

    const mockBankInput: Bank = {
        event: 'BANK_ONBOARD',
        event_by: 'admin',
        eid: 2001,
        edetails: [
            {
                row_id: 1,
                bank_id: 101,
                bank_name: 'Test Bank',
                baddr: '1st Street, Finance City',
                binfo: {
                    name: 'John Manager',
                    phno: 9876543210,
                    email: 'john@bank.com',
                    designation: 'Manager',
                },
            },
        ],
    };

    describe('createBank', () => {
        it('should return success response when insert works', async () => {
            const transformed = await service.transformToBankSchema(mockBankInput);
            const insertQuery = 'INSERT INTO banks ...';

            jest.spyOn(qs, 'validateAndInsertBanks').mockResolvedValueOnce(insertQuery);
            mockPool.query.mockResolvedValueOnce({
                                                     rows: [
                                                         { status: 1, row_id: 1 },
                                                         { status: 0, row_id: 2 },
                                                     ],
                                                 });

            const result = await service.createBank(mockBankInput);

            expect(result).toEqual({
                                       code: banksMessage.SUCCESS_CODE,
                                       message: banksMessage.SUCCESS_MESSAGE,
                                       edata: {
                                           headers: ['status', 'row_id'],
                                           values: [[1, 1], [0, 2]],
                                           status: [2, 1, 1],
                                       },
                                   });
        });

        it('should return server error on DB failure', async () => {
            jest.spyOn(console, 'log').mockImplementation(() => {});
            jest.spyOn(qs, 'validateAndInsertBanks').mockResolvedValueOnce('INSERT ...');
            mockPool.query.mockRejectedValueOnce(new Error('Database error'));

            const result = await service.createBank(mockBankInput);

            expect(result).toEqual({
                                       code: message.ERROR.SERVER_ERROR.code,
                                       message: message.ERROR.SERVER_ERROR.message,
                                   });
        });
    });

    describe('transformToBankSchema', () => {
        it('should transform bank data properly', async () => {
            const result = await service.transformToBankSchema(mockBankInput);

            expect(result).toEqual({
                                       rowIds: [1],
                                       bankIds: [101],
                                       bankNames: ['Test Bank'],
                                       bankAddrs: ['1st Street, Finance City'],
                                       binfoList: [JSON.stringify(mockBankInput.edetails[0].binfo)],
                                       eventBys: ['admin'],
                                       eids: [2001],
                                   });
        });

        it('should handle empty edetails gracefully', async () => {
            const mockData: any = {
                event: 'BANK_ONBOARD',
                event_by: 'admin',
                eid: 2002,
                edetails: [],
            }
            const result = await service.transformToBankSchema(mockData);

            expect(result).toEqual({
                                       rowIds: [],
                                       bankIds: [],
                                       bankNames: [],
                                       bankAddrs: [],
                                       binfoList: [],
                                       eventBys: [],
                                       eids: [],
                                   });
        });
    });
});
