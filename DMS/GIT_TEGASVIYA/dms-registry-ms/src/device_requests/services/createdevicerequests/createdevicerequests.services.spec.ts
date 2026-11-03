import { Test, TestingModule } from '@nestjs/testing';
import { creatDeviceRequests } from './createdevicerequests.services';
import { QueryService } from '../query/query.services';
import { Pool } from 'pg';
import { deviceRequestMessage } from '../../../enums/device_request.enum';
import { message } from '../../../enums/message';
import { DeviceRequest } from '../../interfaces/device_requests.interfaces';
import { WinstonLoggerService } from '../../../common/service/winstonlogger/winstonlogger.service';

describe('creatDeviceRequests', () => {
    let service: creatDeviceRequests;
    let qs: QueryService;
    let pool: Pool;

    const mockPool = {
        query: jest.fn(),
    };

    const mockLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
    };

    const mockQueryService = {
        validateAndInsertDeviceRequest: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                creatDeviceRequests,
                { provide: 'DATABASE_POOL', useValue: mockPool },
                { provide: QueryService, useValue: mockQueryService },
                { provide: WinstonLoggerService, useValue: mockLogger },
            ],
        }).compile();

        service = module.get<creatDeviceRequests>(creatDeviceRequests);
        pool = module.get<Pool>('DATABASE_POOL');
        qs = module.get<QueryService>(QueryService);

        jest.clearAllMocks();
    });

    describe('createDeviceRequests', () => {
        const baseRequest: DeviceRequest = {
            event: 'DEVICE_REQUEST',
            event_by: 'admin',
            eid: 999,
            edetails: [
                {
                    row_id: 1,
                    drid: 10001,
                    context: 'CREATE',
                    bank_name: 'Test Bank',
                    bank_id: 202,
                    branch_name: 'Branch Alpha',
                    merchant_name: 'Merchant ABC',
                    sim_provider: 'SimCo',
                    device_quantity: 5,
                    status: 'PENDING',
                },
            ],
        };

        it('should return low quantity failure if total < 10 for CREATE context', async () => {
            const result = await service.createDeviceRequests(baseRequest);

            expect(result).toEqual({
                code: deviceRequestMessage.FAILURE_CODE,
                message: deviceRequestMessage.LOW_QUANTITY_MESSAGE,
                edata: {},
            });
        });

        it('should insert and return success message for valid data', async () => {
            const validRequest = {
                ...baseRequest,
                edetails: [
                    { ...baseRequest.edetails[0], device_quantity: 7 },
                    { ...baseRequest.edetails[0], row_id: 2, device_quantity: 4 },
                ],
            };

            const insertQuery = 'INSERT INTO device_requests ...';
            jest.spyOn(qs, 'validateAndInsertDeviceRequest').mockResolvedValueOnce(insertQuery);
            mockPool.query.mockResolvedValueOnce({
                rows: [
                    { status: 1, row_id: 1 },
                    { status: 0, row_id: 2 },
                ],
            });

            const result = await service.createDeviceRequests(validRequest);

            expect(result).toEqual({
                code: deviceRequestMessage.SUCCESS_CODE,
                message: deviceRequestMessage.SUCCESS_MESSAGE,
                edata: {
                    headers: ['status', 'row_id'],
                    values: [[1, 1], [0, 2]],
                    status: [2, 1, 1],
                },
            });
        });

        it('should return server error on DB failure', async () => {
            jest.spyOn(qs, 'validateAndInsertDeviceRequest').mockResolvedValueOnce('INSERT ...');
            mockPool.query.mockRejectedValueOnce(new Error('DB error'));

            const result = await service.createDeviceRequests({
                ...baseRequest,
                edetails: [{ ...baseRequest.edetails[0], context: 'REQUEST', device_quantity: 10 }],
            });

            expect(mockLogger.error).toHaveBeenCalled();
            expect(result).toEqual(message.ERROR.SERVER_ERROR);
        });
    });

    describe('transformToRequestDeviceSchema', () => {
        it('should transform valid bulk data correctly', async () => {
            const input: DeviceRequest = {
                event: 'DEVICE_REQUEST',
                event_by: 'system',
                eid: 1001,
                edetails: [
                    {
                        row_id: 2,
                        drid: 1101,
                        context: 'AUTO',
                        bank_name: 'AutoBank',
                        bank_id: 555,
                        branch_name: 'Main',
                        merchant_name: 'MerchantZ',
                        sim_provider: 'SimCorp',
                        device_quantity: 15,
                        status: 'APPROVED',
                    },
                ],
            };

            const result = await service.transformToRequestDeviceSchema(input);

            expect(result).toEqual({
                rowIds: [2],
                drids: [1101],
                contexts: ['AUTO'],
                bankNames: ['AutoBank'],
                bankIds: [555],
                branchNames: ['Main'],
                merchantNames: ['MerchantZ'],
                simProviders: ['SimCorp'],
                deviceQuantities: [15],
                requestStatuses: ['APPROVED'],
                eventBys: ['system'],
                eids: [1001],
            });
        });

        it('should return empty arrays for missing edetails', async () => {
            const input: DeviceRequest = {
                event: 'DEVICE_REQUEST',
                event_by: 'admin',
                eid: 1002,
                edetails: [],
            };

            const result = await service.transformToRequestDeviceSchema(input);

            expect(result).toEqual({
                rowIds: [],
                drids: [],
                contexts: [],
                bankNames: [],
                bankIds: [],
                branchNames: [],
                merchantNames: [],
                simProviders: [],
                deviceQuantities: [],
                requestStatuses: [],
                eventBys: [],
                eids: [],
            });
        });
    });
});
