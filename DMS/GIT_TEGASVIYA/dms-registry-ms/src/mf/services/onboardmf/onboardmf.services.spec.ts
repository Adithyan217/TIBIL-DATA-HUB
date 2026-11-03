import { Test, TestingModule } from '@nestjs/testing';
import { onboardMfService } from './onboardmf.services'; // Replace with actual service path
import { mf } from '../../interfaces/mf.interface';
import { QueryService } from '../query/query.service';
import {Pool} from 'pg'
import { message } from '../../../enums/message'
import { mfMessage } from '../../../enums/mf.enums';
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";


describe('MfService', () => {
    let service: onboardMfService;
    let pool: Pool;
    let qs: QueryService;
    const mockLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
    };
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                onboardMfService,
                {
                    provide: 'DATABASE_POOL', // Mock the DATABASE_POOL provider
                    useValue: {
                        query: jest.fn(), // Mock the query method
                    },
                },
                {
                    provide: QueryService, // Replace with the actual query service provider
                    useValue: {
                        validateAndInsertMF: jest.fn(),
                    },
                },
                { provide: WinstonLoggerService, useValue: mockLogger },
            ],
        }).compile();

        service = module.get<onboardMfService>(onboardMfService);
        pool = module.get("DATABASE_POOL");
        qs = module.get<QueryService>(QueryService)
    });

    describe('createmf', () => {
        it('should successfully onboard a manufacturer and return details', async () => {
            const mockMfInfo:mf = {
                "event": "ManufacturerOnboarding",
                "event_by": "admin",
                "eid": 12345,
                "edetails": [
                    {
                        "row_id": 1,
                        "mfid": 101,
                        "mfname": "Tech Solutions",
                        "mfaddr": "123 Tech Street, Silicon Valley, CA",
                        "mfinfo": {
                            "name": "John Doe",
                            "phno": "9876543210",
                            "email": "john.doe@techsolutions.com"
                        }
                    }
                ]
            }


            const mockQueryResult = {
                rows: [{ status: 1 }, { status: 0 }],
            };

            jest.spyOn(service, 'transformToMFSchema').mockResolvedValueOnce({
                rowIds: [1],
                mfIds: [101],
                mfNames: ['Manufacturer1'],
                mfAddrs: ['123 Main Street'],
                mfinfoList: ['{"type":"Hardware","license":"XYZ-123"}'],
                eventBys: ['admin'],
                eids: [12345],
            });

            jest.spyOn(qs, 'validateAndInsertMF').mockResolvedValueOnce('INSERT INTO manufacturers (...)');
            jest.spyOn(pool, 'query').mockResolvedValueOnce(mockQueryResult);

            const result = await service.createmf(mockMfInfo);

            expect(service.transformToMFSchema).toHaveBeenCalledWith(mockMfInfo);
            expect(pool.query).toHaveBeenCalled();
            expect(result).toEqual({
                code: mfMessage.SUCCESS_CODE,
                message: mfMessage.SUCCESS_MESSAGE,
                edata: {
                    headers: ['status'],
                    values: [[1], [0]],
                    status: [2, 1, 1], // Total rows, successfully inserted, failed inserted
                },
            });
        });

        it('should return a server error on exception', async () => {
            const mockMfInfo = {
                "event": "ManufacturerOnboarding",
                "event_by": "admin",
                "eid": 12345,
                "edetails": []
            }

            jest.spyOn(service, 'transformToMFSchema').mockRejectedValueOnce(new Error('Transform error'));

            const result = await service.createmf(mockMfInfo as unknown as any);

            expect(result).toEqual(message.ERROR.SERVER_ERROR);
        });
    });

    describe('transformToMFSchema', () => {
        it('should transform manufacturer data into the correct schema', async () => {
            const mockMfInfo :mf = {
                "event": "ManufacturerOnboarding",
                "event_by": "admin",
                "eid": 12345,
                "edetails": [
                    {
                        "row_id": 1,
                        "mfid": 101,
                        "mfname": "Tech Solutions",
                        "mfaddr": "123 Tech Street, Silicon Valley, CA",
                        "mfinfo": {
                            "name": "John Doe",
                            "phno": "9876543210",
                            "email": "john.doe@techsolutions.com"
                        }
                    }
                ]
            }

            const result = await service.transformToMFSchema(mockMfInfo);

            expect(result).toEqual({
                rowIds: [1],
                mfIds: [101],
                mfNames: ['Tech Solutions'],
                mfAddrs: ['123 Tech Street, Silicon Valley, CA'],
                mfinfoList: ['{"name":"John Doe","phno":"9876543210","email":"john.doe@techsolutions.com"}', ],
                eventBys: ['admin'],
                eids: [12345],
            });
        });

        it('should handle empty details gracefully', async () => {
            const mockMfInfo = {
                "event": "ManufacturerOnboarding",
                "event_by": "admin",
                "eid": 12345,
                "edetails": []
            }

            const result = await service.transformToMFSchema(mockMfInfo as unknown as any);

            expect(result).toEqual({
                rowIds: [],
                mfIds: [],
                mfNames: [],
                mfAddrs: [],
                mfinfoList: [],
                eventBys: [],
                eids: [],
            });
        });
    });
});
