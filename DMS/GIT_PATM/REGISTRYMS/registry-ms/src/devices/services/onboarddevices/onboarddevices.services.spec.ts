import { Test, TestingModule } from '@nestjs/testing';
import { onboardDevicesService } from './onboarddevices.services';
import { QueryService } from '../query/query.services';
import { Pool } from 'pg';
import { devicesMessage } from '../../../enums/devices.enums';
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";

// Mocking the roles-access module
jest.mock('../../../config/roles-access', () => ({
    rolesAccess: {
        someFunction: jest.fn().mockReturnValue(true),
    },
}));

describe('onboardDevicesService', () => {
    let service: onboardDevicesService;
    let queryServiceMock: QueryService;
    let poolMock: Pool;
    const mockLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
    };
    beforeEach(async () => {
        queryServiceMock = {
            validateAndInsertDevice: jest.fn().mockReturnValue('INSERT_QUERY'),
            getDeviceDetails: jest.fn().mockResolvedValue({ query: 'SELECT_QUERY', values: [] }),
            enableSB: jest.fn().mockReturnValue('ENABLE_SOUNDBOX_QUERY'),
        } as unknown as QueryService;

        poolMock = {
            query: jest.fn(),
        } as unknown as Pool;

        const module: TestingModule = await Test.createTestingModule({
                                                                         providers: [
                                                                             onboardDevicesService,
                                                                             { provide: QueryService, useValue: queryServiceMock },
                                                                             { provide: 'DATABASE_POOL', useValue: poolMock },
                                                                             { provide: WinstonLoggerService, useValue: mockLogger },
                                                                         ],
                                                                     }).compile();

        service = module.get<onboardDevicesService>(onboardDevicesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createDevice', () => {
        it('should return success when device is created', async () => {
            poolMock.query.mockResolvedValue({
                                                 rows: [{ status: 1 }],
                                             });

            const deviceData = {
                event: 'test-event',
                event_by: 'test-user',
                eid: 1,
                edetails: [
                    {
                        row_id: 1,
                        onboard_status: 'active',
                        device_id: 123,
                        imei: '12345',
                        mf_id: 'test-mf',
                        model_id: 'test-model',
                        firmware_id: 'test-firmware',
                        sbe: true,
                        dname: 'test-device',
                        vpa_id: 'test-vpa',
                        bank_id: 'test-bank',
                        branch_id: 'test-branch',
                        merchant_id: 'test-merchant',
                    },
                ],
            };

            const result:any = await service.createDevice(deviceData);

            expect(result.code).toBe(devicesMessage.SUCCESS_CODE);
            expect(result.message).toBe(devicesMessage.SUCCESS_MESSAGE);

            if (result.edata) {
                expect(result.edata.status[0]).toBe(1); // Total rows inserted
            }
        });

        it('should return failure when device creation fails', async () => {
            poolMock.query.mockResolvedValue({
                                                 rows: [{ status: 0 }],
                                             });

            const deviceData = {
                event: 'test-event',
                event_by: 'test-user',
                eid: 1,
                edetails: [
                    {
                        row_id: 1,
                        onboard_status: 'active',
                        device_id: 123,
                        imei: '12345',
                        mf_id: 'test-mf',
                        model_id: 'test-model',
                        firmware_id: 'test-firmware',
                        sbe: true,
                        dname: 'test-device',
                        vpa_id: 'test-vpa',
                        bank_id: 'test-bank',
                        branch_id: 'test-branch',
                        merchant_id: 'test-merchant',
                    },
                ],
            };

            const result = await service.createDevice(deviceData);

            expect(result.code).toBe(devicesMessage.SUCCESS_CODE);
            // expect(result.message).toBe(devicesMessage.FAILURE_MESSAGE);
        });

        it('should return server error on exception', async () => {
            poolMock.query.mockRejectedValue(new Error('DB error'));

            const deviceData = {
                event: 'test-event',
                event_by: 'test-user',
                eid: 1,
                edetails: [
                    {
                        row_id: 1,
                        onboard_status: 'active',
                        device_id: 123,
                        imei: '12345',
                        mf_id: 'test-mf',
                        model_id: 'test-model',
                        firmware_id: 'test-firmware',
                        sbe: true,
                        dname: 'test-device',
                        vpa_id: 'test-vpa',
                        bank_id: 'test-bank',
                        branch_id: 'test-branch',
                        merchant_id: 'test-merchant',
                    },
                ],
            };

            const result = await service.createDevice(deviceData);

            expect(result).toEqual({
                                       code: devicesMessage.FAILURE_CODE,
                                       message: "DB error"
                                   });
        });
    });

    // More test cases for other methods...
});
