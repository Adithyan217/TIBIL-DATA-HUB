import { Test, TestingModule } from '@nestjs/testing';
import { createSimRequests } from './createsimrequests.services';
import { QueryService } from '../query/query.services';
import { WinstonLoggerService } from '../../../common/service/winstonlogger/winstonlogger.service';
import { Pool } from 'pg';
import { simRequestMessage } from '../../../enums/sim_request.enum';
import { message } from '../../../enums/message';
import { SimRequest } from '../../interfaces/sim.interfaces';

describe('createSimRequests', () => {
    let service: createSimRequests;
    let mockPool: any;
    let mockQueryService: Partial<QueryService>;
    let mockLoggerService: Partial<WinstonLoggerService>;

    beforeEach(async () => {
        mockPool = {
            query: jest.fn(),
        };

        mockQueryService = {
            validateAndInsertSimRequest: jest.fn().mockResolvedValue({
                                                                         query: 'INSERT INTO sim_requests...',
                                                                         values: [],
                                                                     }),

        };

        mockLoggerService = {
            error: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
                                                                         providers: [
                                                                             createSimRequests,
                                                                             { provide: 'DATABASE_POOL', useValue: mockPool },
                                                                             { provide: QueryService, useValue: mockQueryService },
                                                                             { provide: WinstonLoggerService, useValue: mockLoggerService },
                                                                         ],
                                                                     }).compile();

        service = module.get<createSimRequests>(createSimRequests);
    });

    it('should successfully create sim request and return success message', async () => {
        const simRequestData: SimRequest = {
            eid: 123,  // Ensure eid is a number, as per the interface
            event: 'some_event',  // Add the missing 'event' field
            event_by: 'user123',
            edetails: [{
                row_id: 1,
                srid: 101,
                context: 'context1',
                device: 'device1',
                bank_name: 'bank1',
                bank_id: 1,
                branch: 'branch1',
                merchant: 'merchant1',
                status: 'active',
                current_sp: 'sp1',
                requested_sp: 'sp2',
            }],
        };

        const transformedData = {
            rowid: 1,
            srid: 101,
            context: 'context1',
            device: 'device1',
            bank_name: 'bank1',
            bank_id: 1,
            branch: 'branch1',
            merchant: 'merchant1',
            status: 'active',
            eventBy: 'user123',
            eid: 123,
            current_sp: 'sp1',
            requested_sp: 'sp2',
        };

        mockPool.query.mockResolvedValue({
                                             rows: [
                                                 {
                                                     rowid: 1,
                                                     srid: 101,
                                                     context: 'context1',
                                                     device: 'device1',
                                                     bank_name: 'bank1',
                                                     bank_id: 1,
                                                     branch: 'branch1',
                                                     merchant: 'merchant1',
                                                     status: 1,
                                                     eventBy: 'user123',
                                                     eid: 123,
                                                     current_sp: 'sp1',
                                                     requested_sp: 'sp2',
                                                 },
                                             ],
                                         });

        const result:any = await service.createSimRequests(simRequestData);

        expect(result.code).toBe(simRequestMessage.SUCCESS_CODE);
        expect(result.message).toBe(simRequestMessage.SUCCESS_MESSAGE);
        expect(result.edata.status).toEqual([1, 1, 0]);
        expect(mockPool.query).toHaveBeenCalled();
    });

    it('should handle server error if query fails', async () => {
        const simRequestData: SimRequest = {
            eid: 123,
            event: 'some_event',
            event_by: 'user123',
            edetails: [{
                row_id: 1,
                srid: 101,
                context: 'context1',
                device: 'device1',
                bank_name: 'bank1',
                bank_id: 1,
                branch: 'branch1',
                merchant: 'merchant1',
                status: 'active',
                current_sp: 'sp1',
                requested_sp: 'sp2',
            }],
        };

        mockPool.query.mockRejectedValue(new Error('DB query failed'));

        const result = await service.createSimRequests(simRequestData);

        expect(result).toBe(message.ERROR.SERVER_ERROR);
        expect(mockLoggerService.error).toHaveBeenCalledWith('The error is::", DB query failed');
    });


});
