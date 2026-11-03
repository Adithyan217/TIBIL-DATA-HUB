import { Test, TestingModule } from '@nestjs/testing';
import { onboardMerchantService } from './onboardmerchant.services';
import { QueryService } from '../query/query.services';
import { WinstonLoggerService } from '../../../common/service/winstonlogger/winstonlogger.service';
import { Pool } from 'pg';
import { merchantMessage } from '../../../enums/merchant.enums';
import { message } from '../../../enums/message';
import { Merchant } from '../../interfaces/merchant.interface';

describe('onboardMerchantService', () => {
    let service: onboardMerchantService;
    let pool: Pool;
    let qs: QueryService;
    let mockLogger: WinstonLoggerService;

    const mockPool = {
        query: jest.fn(),
    };

    const mockQueryService = {
        validateAndInsertMerchant: jest.fn(),
    };

    const mockLoggerService = {
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
                                                                         providers: [
                                                                             onboardMerchantService,
                                                                             { provide: 'DATABASE_POOL', useValue: mockPool },
                                                                             { provide: QueryService, useValue: mockQueryService },
                                                                             { provide: WinstonLoggerService, useValue: mockLoggerService },
                                                                         ],
                                                                     }).compile();

        service = module.get<onboardMerchantService>(onboardMerchantService);
        pool = module.get<Pool>('DATABASE_POOL');
        qs = module.get<QueryService>(QueryService);
        mockLogger = module.get<WinstonLoggerService>(WinstonLoggerService);

        jest.clearAllMocks();
    });

    describe('createMerchant', () => {
        const mockMerchantData: Merchant = {
            event: 'MERCHANT_ONBOARD',
            event_by: 'admin',
            eid: 123,
            edetails: [
                {
                    row_id: 1,
                    merchant_id: 1001,
                    mname: 'Merchant A',
                    maddr: 'Address A',
                    bank_id: 'Bank X',
                    branch_id: 'Branch X1',
                    minfo: {
                        accName: 'MerchantA Pvt Ltd',
                        accHolderName: 'John Doe',
                        phno: 9876543210,
                    },
                    msid: 501,
                },
            ],
        };

        it('should return success response when records are inserted', async () => {
            const insertQuery = 'INSERT INTO merchant_table ...';
            const transformed = await service.transformToMerchantSchema(mockMerchantData);

            // Mocking the async method
            jest.spyOn(qs, 'validateAndInsertMerchant').mockResolvedValueOnce(insertQuery);
            mockPool.query.mockResolvedValueOnce({
                                                     rows: [
                                                         { status: 1, row_id: 1 },
                                                         { status: 0, row_id: 2 },
                                                     ],
                                                 });

            const result = await service.createMerchant(mockMerchantData);

            expect(qs.validateAndInsertMerchant).toHaveBeenCalled();
            expect(mockPool.query).toHaveBeenCalledWith(insertQuery, [
                transformed.rowIds,
                transformed.mpid,
                transformed.merchantNames,
                transformed.maddrs,
                transformed.bankNames,
                transformed.branchNames,
                transformed.minfoList,
                transformed.msid,
                transformed.eventBys,
                transformed.eids,
                transformed.mtype,
            ]);

            expect(result).toEqual({
                                       code: merchantMessage.SUCCESS_CODE,
                                       message: merchantMessage.SUCCESS_MESSAGE,
                                       edata: {
                                           headers: ['status', 'row_id'],
                                           values: [[1, 1], [0, 2]],
                                           status: [2, 1, 1],
                                       },
                                   });
        });

        it('should return server error on exception', async () => {
            jest.spyOn(qs, 'validateAndInsertMerchant').mockResolvedValueOnce('INSERT INTO ...');
            mockPool.query.mockRejectedValueOnce(new Error('Something went wrong'));

            const result = await service.createMerchant(mockMerchantData);

            expect(result).toEqual(message.ERROR.SERVER_ERROR);
        });
    });

    describe('transformToMerchantSchema', () => {
        it('should return transformed merchant schema from valid input', async () => {
            const mockMerchant: Merchant = {
                event: 'MERCHANT_ONBOARD',
                event_by: 'admin',
                eid: 999,
                edetails: [
                    {
                        row_id: 2,
                        merchant_id: 2002,
                        mname: 'Merchant Z',
                        maddr: 'Z Street',
                        bank_id: 'Bank Z',
                        branch_id: 'Branch Z1',
                        minfo: {
                            accName: 'Merchant Z Ltd',
                            accHolderName: 'Jane Smith',
                            phno: 9998887770,
                        },
                        msid: 808,
                    },
                ],
            };

            const result = await service.transformToMerchantSchema(mockMerchant);

            expect(result).toEqual({
                                       rowIds: [2],
                                       mpid: [2002],
                                       merchantNames: ['Merchant Z'],
                                       maddrs: ['Z Street'],
                                       bankNames: ['Bank Z'],
                                       branchNames: ['Branch Z1'],
                                       minfoList: [JSON.stringify({
                                                                      accName: 'Merchant Z Ltd',
                                                                      accHolderName: 'Jane Smith',
                                                                      phno: 9998887770,
                                                                  })],
                                       msid: [808],
                                       eventBys: ['admin'],
                                       eids: [999],
                                       mtype: [undefined], // changed null to undefined
                                   });
        });

        it('should return empty arrays for empty edetails', async () => {
            const emptyData: any = {
                event: 'MERCHANT_ONBOARD',
                event_by: 'admin',
                eid: 111,
                edetails: [],
            };

            const result = await service.transformToMerchantSchema(emptyData);

            expect(result).toEqual({
                                       rowIds: [],
                                       mpid: [],
                                       merchantNames: [],
                                       maddrs: [],
                                       bankNames: [],
                                       branchNames: [],
                                       minfoList: [],
                                       msid: [],
                                       eventBys: [],
                                       eids: [],
                                       mtype: [],
                                   });
        });
    });
});
