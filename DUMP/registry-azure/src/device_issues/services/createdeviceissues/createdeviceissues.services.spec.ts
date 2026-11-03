import { Test, TestingModule } from '@nestjs/testing';
import { creatDeviceIssues } from './createdeviceissues.services';
import { QueryService } from '../query/query.services';
import { Pool } from 'pg';
import { deviceIssueMessage } from '../../../enums/device_issue.enum';
import { message } from '../../../enums/message';
import { DeviceIssue } from '../../interfaces/device_issues.interfaces';
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";

describe('creatDeviceIssues', () => {
    let service: creatDeviceIssues;
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
        validateAndInsertDeviceIssue: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
                                                                         providers: [
                                                                             creatDeviceIssues,
                                                                             { provide: 'DATABASE_POOL', useValue: mockPool },
                                                                             { provide: QueryService, useValue: mockQueryService },
                                                                             { provide: WinstonLoggerService, useValue: mockLogger },
                                                                         ],
                                                                     }).compile();

        service = module.get<creatDeviceIssues>(creatDeviceIssues);
        qs = module.get<QueryService>(QueryService);
        pool = module.get<Pool>('DATABASE_POOL');

        jest.clearAllMocks();
    });

    describe('createDeviceIssues', () => {
        const mockDeviceIssue: DeviceIssue = {
            event: 'DEVICE_ISSUE',
            event_by: 'admin',
            eid: 101,
            edetails: [
                {
                    row_id: 1,
                    iid: 12345,
                    context: 'Failure during transaction',
                    device: 'DEV001',
                    vpa: 'dev001@bank',
                    bank_name: 'Bank A',
                    bank_id: 201,
                    branch: 'Main',
                    merchant: 'MerchantX',
                    mphno: '9876543210',
                    status: 'PENDING',
                    issue: 'Soundbox not responding',
                },
            ],
        };

        it('should return success response when rows are inserted', async () => {
            const insertQuery = 'INSERT INTO device_issues ...';
            jest.spyOn(qs, 'validateAndInsertDeviceIssue').mockResolvedValueOnce(insertQuery);
            mockPool.query.mockResolvedValueOnce({
                                                     rows: [
                                                         { row_id: 1, status: 1 },
                                                         { row_id: 2, status: 0 },
                                                     ],
                                                 });

            const result = await service.createDeviceIssues(mockDeviceIssue);

            expect(result).toEqual({
                                       code: deviceIssueMessage.SUCCESS_CODE,
                                       message: deviceIssueMessage.SUCCESS_MESSAGE,
                                       edata: {
                                           headers: ['row_id', 'status'],
                                           values: [[1, 1], [2, 0]],
                                           status: [2, 1, 1],
                                       },
                                   });
        });

        it('should return SERVER_ERROR if DB query fails', async () => {
            jest.spyOn(console, 'log').mockImplementation(() => {});
            jest.spyOn(qs, 'validateAndInsertDeviceIssue').mockResolvedValueOnce('INSERT ...');
            mockPool.query.mockRejectedValueOnce(new Error('DB failure'));

            const result = await service.createDeviceIssues(mockDeviceIssue);

            expect(result).toEqual(message.ERROR.SERVER_ERROR);
        });
    });

    describe('transformToDeviceIssuesSchema', () => {
        it('should transform data correctly', async () => {
            const result = await service.transformToDeviceIssuesSchema({
                                                                           event: 'DEVICE_ISSUE',
                                                                           event_by: 'admin',
                                                                           eid: 101,
                                                                           edetails: [
                                                                               {
                                                                                   row_id: 1,
                                                                                   iid: 222,
                                                                                   context: 'Hardware issue',
                                                                                   device: 'DEV777',
                                                                                   vpa: 'dev777@upi',
                                                                                   bank_name: 'TestBank',
                                                                                   bank_id: 9001,
                                                                                   branch: 'South',
                                                                                   merchant: 'MerchantY',
                                                                                   mphno: '9999999999',
                                                                                   status: 'OPEN',
                                                                                   issue: 'No display',
                                                                               },
                                                                           ],
                                                                       });

            expect(result).toEqual({
                                       rowid: 1,
                                       iid: 222,
                                       context: 'Hardware issue',
                                       device: 'DEV777',
                                       vpa: 'dev777@upi',
                                       bank_name: 'TestBank',
                                       bank_id: 9001,
                                       branch: 'South',
                                       merchant: 'MerchantY',
                                       mphno: '9999999999',
                                       status: 'OPEN',
                                       issue: 'No display',
                                       eventBy: 'admin',
                                       eid: 101,
                                   });
        });

        it('should handle missing edetails gracefully', async () => {
            const result = await service.transformToDeviceIssuesSchema({
                                                                           event: 'DEVICE_ISSUE',
                                                                           event_by: 'admin',
                                                                           eid: 202,
                                                                           edetails: [],
                                                                       } as unknown as DeviceIssue);

            expect(result).toEqual({
                                       rowid: null,
                                       iid: null,
                                       context: null,
                                       device: null,
                                       vpa: null,
                                       bank_name: null,
                                       bank_id: null,
                                       branch: null,
                                       merchant: null,
                                       mphno: null,
                                       status: null,
                                       issue: null,
                                       eventBy: 'admin',
                                       eid: 202,
                                   });
        });


    });
});
