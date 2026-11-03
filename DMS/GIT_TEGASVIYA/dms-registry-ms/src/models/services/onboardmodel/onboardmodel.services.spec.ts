import { Test, TestingModule } from '@nestjs/testing';
import { onboardModelService } from './onboardmodel.services';
import { model } from '../../../models/interfaces/model.interface';
import { QueryService } from '../query/query.service';
import { Pool } from 'pg';
import { message } from '../../../enums/message';
import { modelMessage } from '../../../enums/model.enums';
import {WinstonLoggerService} from "../../../common/service/winstonlogger/winstonlogger.service";

describe('onboardModelService', () => {
    let service: onboardModelService;
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
                                                                             onboardModelService,
                                                                             {
                                                                                 provide: 'DATABASE_POOL',
                                                                                 useValue: {
                                                                                     query: jest.fn(),
                                                                                 },
                                                                             },
                                                                             {
                                                                                 provide: QueryService,
                                                                                 useValue: {
                                                                                     validateAndInsertModel: jest.fn(),
                                                                                 },
                                                                             },
                                                                             { provide: WinstonLoggerService, useValue: mockLogger },
                                                                         ],
                                                                     }).compile();

        service = module.get<onboardModelService>(onboardModelService);
        pool = module.get("DATABASE_POOL");
        qs = module.get<QueryService>(QueryService);
    });

    describe('createModel', () => {
        it('should successfully onboard a model and return details', async () => {
            const mockModelInfo: model = {
                event: "ModelOnboarding",
                event_by: "admin",
                eid: 45678,
                edetails: [
                    {
                        row_id: 1,
                        mfid: "101",
                        firmware_id: "201",
                        model_name: "ModelX Pro"
                    }
                ]
            };

            const mockQueryResult = {
                rows: [{ status: 1 }, { status: 0 }],
            };

            jest.spyOn(service, 'transformToModelSchema').mockResolvedValueOnce({
                                                                                    rowIds: [1, 2, 3],
                                                                                    mfNames: ["MF123", "MF456", "MF789"],
                                                                                    mdName: ["ModelX", "ModelY", "ModelZ"],
                                                                                    fNames: ["FW_1.0.0", "FW_2.1.0", "FW_3.0.2"],
                                                                                    eventBys: ["userA", "userB", "userC"],
                                                                                    eids: [101, 102, 103],
                                                                                });

            jest.spyOn(qs, 'validateAndInsertModel').mockResolvedValueOnce('INSERT INTO models (...)');
            jest.spyOn(pool, 'query').mockResolvedValueOnce(mockQueryResult);

            const result = await service.createModel(mockModelInfo);

            expect(service.transformToModelSchema).toHaveBeenCalledWith(mockModelInfo);
            expect(pool.query).toHaveBeenCalled();
            expect(result).toEqual({
                                       code: modelMessage.SUCCESS_CODE,
                                       message: modelMessage.SUCCESS_MESSAGE,
                                       edata: {
                                           headers: ['status'],
                                           values: [[1], [0]],
                                           status: [2, 1, 1],
                                       },
                                   });
        });

        it('should return a server error on exception', async () => {
            const mockModelInfo = {
                event_by: 'admin',
                eid: 78901,
                edetails: [],
            };

            jest.spyOn(service, 'transformToModelSchema').mockRejectedValueOnce(new Error('Transform error'));

            const result = await service.createModel(mockModelInfo as any);

            expect(result).toEqual(message.ERROR.SERVER_ERROR);
        });
    });

    describe('transformToModelSchema', () => {
        it('should transform model data into the correct schema', async () => {
            const mockModelInfo: model = {
                event: "ModelOnboarding",
                event_by: "admin",
                eid: 45678,
                edetails: [
                    {
                        row_id: 1,
                        mfid: "101",
                        firmware_id: "201",
                        model_name: "ModelX Pro"
                    }
                ]
            };

            const result = await service.transformToModelSchema(mockModelInfo);

            expect(result).toEqual({
                                       rowIds: [1],
                                       mfNames: ["101"],
                                       mdName: ["ModelX Pro"],
                                       fNames: ["201"],
                                       eventBys: ["admin"],
                                       eids: [45678],
                                   });
        });

        it('should handle empty details gracefully', async () => {
            const mockModelInfo = {
                event_by: 'admin',
                eid: 78901,
                edetails: [],
            };

            const result = await service.transformToModelSchema(mockModelInfo as any);

            expect(result).toEqual({
                                       rowIds: [],
                                       mfNames: [],
                                       mdName: [],
                                       fNames: [],
                                       eventBys: [],
                                       eids: [],
                                   });
        });
    });
});
