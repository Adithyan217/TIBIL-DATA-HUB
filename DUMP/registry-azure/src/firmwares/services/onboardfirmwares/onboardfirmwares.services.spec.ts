import { Test, TestingModule } from '@nestjs/testing';
import { onboardFirmwareService } from './onboardfirmwares.services';
import { QueryService } from '../query/query.service';
import { Pool } from 'pg';
import { firmwareOnboardingMessage } from '../../../enums/firmware.enums';
import { message } from '../../../enums/message';
import { firmware } from '../../interfaces/firmwares.interface';
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";

describe('onboardFirmwareService', () => {
    let service: onboardFirmwareService;
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
        validateAndInsertFirmware: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
                                                                         providers: [
                                                                             onboardFirmwareService,
                                                                             { provide: 'DATABASE_POOL', useValue: mockPool },
                                                                             { provide: QueryService, useValue: mockQueryService },
                                                                             { provide: WinstonLoggerService, useValue: mockLogger },
                                                                         ],
                                                                     }).compile();

        service = module.get<onboardFirmwareService>(onboardFirmwareService);
        pool = module.get<Pool>('DATABASE_POOL');
        qs = module.get<QueryService>(QueryService);

        jest.clearAllMocks();
    });

    describe('createFirmware', () => {
        const mockFirmwareData: firmware = {
            event: 'FIRMWARE_UPLOAD',
            event_by: 'admin',
            eid: 123,
            edetails: [
                {
                    row_id: 1,
                    fname: 'FW_v1.0',
                    mfid: 'MF123',
                },
            ],
        };

        it('should return success response when records are inserted', async () => {
            const transformed = await service.transformToFirmwareSchema(mockFirmwareData);
            const insertQuery = 'INSERT INTO firmware_table ...';

            jest.spyOn(qs, 'validateAndInsertFirmware').mockResolvedValueOnce(insertQuery);
            mockPool.query.mockResolvedValueOnce({
                                                     rows: [
                                                         { status: 1, row_id: 1 },
                                                         { status: 0, row_id: 2 },
                                                     ],
                                                 });

            const result = await service.createFirmware(mockFirmwareData);

            expect(qs.validateAndInsertFirmware).toHaveBeenCalled();
            expect(mockPool.query).toHaveBeenCalledWith(insertQuery, [
                transformed.rowIds,
                transformed.mfNames,
                transformed.firmwareNames,
                transformed.eventBys,
                transformed.eids,
            ]);

            expect(result).toEqual({
                                       code: firmwareOnboardingMessage.SUCCESS_CODE,
                                       message: firmwareOnboardingMessage.SUCCESS_MESSAGE,
                                       edata: {
                                           headers: ['status', 'row_id'],
                                           values: [[1, 1], [0, 2]],
                                           status: [2, 1, 1],
                                       },
                                   });
        });

        it('should return server error on exception', async () => {
            jest.spyOn(qs, 'validateAndInsertFirmware').mockResolvedValueOnce('INSERT INTO ...');
            mockPool.query.mockRejectedValueOnce(new Error('DB Error'));

            const result = await service.createFirmware(mockFirmwareData);

            expect(result).toEqual(message.ERROR.SERVER_ERROR);
        });
    });

    describe('transformToFirmwareSchema', () => {
        it('should transform valid firmware input correctly', async () => {
            const input: firmware = {
                event: 'FIRMWARE_UPLOAD',
                event_by: 'admin',
                eid: 999,
                edetails: [
                    {
                        row_id: 1,
                        fname: 'FW_XYZ',
                        mfid: 'MF999',
                    },
                ],
            };

            const result = await service.transformToFirmwareSchema(input);

            expect(result).toEqual({
                                       rowIds: [1],
                                       firmwareNames: ['FW_XYZ'],
                                       mfNames: ['MF999'],
                                       eventBys: ['admin'],
                                       eids: [999],
                                   });
        });

        it('should handle empty edetails gracefully', async () => {
            const input = {
                event: 'FIRMWARE_UPLOAD',
                event_by: 'admin',
                eid: 456,
                edetails: [],
            } as unknown as firmware; // cast needed as `edetails` is a tuple

            const result = await service.transformToFirmwareSchema(input);

            expect(result).toEqual({
                                       rowIds: [],
                                       firmwareNames: [],
                                       mfNames: [],
                                       eventBys: [],
                                       eids: [],
                                   });
        });
    });
});
