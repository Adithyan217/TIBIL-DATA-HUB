import { Test, TestingModule } from '@nestjs/testing';
import { onboardBranchService } from './onboardbranch.service';
import { QueryService } from '../query/query.service';
import { Pool } from 'pg';
import { branchesMessage } from '../../../enums/branches.enums';
import { message } from '../../../enums/message';
import { Branch } from '../../interfaces/branch.interface';
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";

describe('onboardBranchService', () => {
    let service: onboardBranchService;
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
        validateAndInsertBranch: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
                                                                         providers: [
                                                                             onboardBranchService,
                                                                             { provide: 'DATABASE_POOL', useValue: mockPool },
                                                                             { provide: QueryService, useValue: mockQueryService },
                                                                             { provide: WinstonLoggerService, useValue: mockLogger },
                                                                         ],
                                                                     }).compile();

        service = module.get<onboardBranchService>(onboardBranchService);
        pool = module.get<Pool>('DATABASE_POOL');
        qs = module.get<QueryService>(QueryService);
        jest.clearAllMocks();
    });

    const mockBranchData: Branch = {
        event: 'BRANCH_ONBOARD',
        event_by: 'admin',
        eid: 1001,
        edetails: [
            {
                row_id: 1,
                branch_id: 101,
                bank_id: 'BANK123',
                branch_name: 'Main Branch',
                braddr: '123 Street',
                brinfo: {
                    name: 'John Manager',
                    designation: 'Manager',
                    phno: '9999999999',
                    email: 'john@bank.com',
                },
            },
        ],
    };

    describe('createBranch', () => {
        it('should insert branch and return success response', async () => {
            const transformed = await service.transformToBranchSchema(mockBranchData);
            const insertQuery = 'INSERT INTO branches ...';

            jest.spyOn(qs, 'validateAndInsertBranch').mockResolvedValueOnce(insertQuery);
            mockPool.query.mockResolvedValueOnce({
                                                     rows: [
                                                         { status: 1, row_id: 1 },
                                                         { status: 0, row_id: 2 },
                                                     ],
                                                 });

            const result = await service.createBranch(mockBranchData);

            expect(result).toEqual({
                                       code: branchesMessage.SUCCESS_CODE,
                                       message: branchesMessage.SUCCESS_MESSAGE,
                                       edata: {
                                           headers: ['status', 'row_id'],
                                           values: [[1, 1], [0, 2]],
                                           status: [2, 1, 1],
                                       },
                                   });
        });

        it('should return SERVER_ERROR if DB fails', async () => {
            jest.spyOn(console, 'log').mockImplementation(() => {});
            jest.spyOn(qs, 'validateAndInsertBranch').mockResolvedValueOnce('INSERT ...');
            mockPool.query.mockRejectedValueOnce(new Error('DB Failure'));

            const result = await service.createBranch(mockBranchData);
            expect(result).toEqual(message.ERROR.SERVER_ERROR);
        });
    });

    describe('transformToBranchSchema', () => {
        it('should transform input correctly', async () => {
            const result = await service.transformToBranchSchema(mockBranchData);

            expect(result).toEqual({
                                       rowIds: [1],
                                       branchIds: [101],
                                       bankNames: ['BANK123'],
                                       branchNames: ['Main Branch'],
                                       branchAddrs: ['123 Street'],
                                       brinfoList: [JSON.stringify(mockBranchData.edetails[0].brinfo)],
                                       eventBys: ['admin'],
                                       eids: [1001],
                                   });
        });

        it('should handle empty edetails safely', async () => {
            const input: any = {
                event: 'BRANCH_ONBOARD',
                event_by: 'admin',
                eid: 1002,
                edetails: [],
            };

            const result = await service.transformToBranchSchema(input);

            expect(result).toEqual({
                                       rowIds: [],
                                       branchIds: [],
                                       bankNames: [],
                                       branchNames: [],
                                       branchAddrs: [],
                                       brinfoList: [],
                                       eventBys: [],
                                       eids: [],
                                   });
        });
    });
});
