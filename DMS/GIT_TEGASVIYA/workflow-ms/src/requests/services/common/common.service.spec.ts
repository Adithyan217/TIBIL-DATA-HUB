// common.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { commonService } from './common.service';
import { queryService } from '../query/query.service';
import { HttpService } from '@nestjs/axios';
import { WinstonLoggerService } from '../winstonlogger/winstonlogger.service';
import { CODE, MESSAGE } from '../enum/common_messages.enum';

describe('commonService', () => {
  let service: commonService;
  let mockPool: any;
  let mockQueryService: any;
  let mockLogger: any;

  beforeEach(async () => {
    mockPool = {
      query: jest.fn(),
    };

    mockQueryService = {
      upermissions: jest.fn(),
    };

    mockLogger = {
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        commonService,
        { provide: 'DATABASE_POOL', useValue: mockPool },
        { provide: queryService, useValue: mockQueryService },
        { provide: HttpService, useValue: {} },
        { provide: WinstonLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<commonService>(commonService);
  });

  const mockBody = {
    data: [
      {
        r_username: 'johndoe',
        r_fname: 'John',
        r_lname: 'Doe',
        r_context: 1,
        r_context_id: 101,
        r_action: 'CREATE',
      },
      {
        r_username: 'johndoe',
        r_fname: 'John',
        r_lname: 'Doe',
        r_context: 2,
        r_context_id: 102,
        r_action: 'DELETE',
      },
    ],
  };

  it('should return 200 and rows when insertion is successful', async () => {
    const mockQuery = 'INSERT INTO permissions ...';
    const mockRows = [{ id: 1, message: 'inserted' }];

    mockQueryService.upermissions.mockResolvedValue(mockQuery);
    mockPool.query.mockResolvedValue({ rows: mockRows });

    const result = await service.addUserPermissions(mockBody);

    expect(result.status).toBe(200);
    expect(result.data.code).toBe(CODE.SUCCESS);
    expect(result.data.data).toEqual(mockRows);
  });

  it('should return 200 and invalid code if no rows returned', async () => {
    const mockQuery = 'INSERT INTO permissions ...';

    mockQueryService.upermissions.mockResolvedValue(mockQuery);
    mockPool.query.mockResolvedValue({ rows: [] });

    const result = await service.addUserPermissions(mockBody);

    expect(result.status).toBe(200);
    expect(result.data.code).toBe(CODE.INVALID);
    expect(result.data.message).toBe(MESSAGE.FAILURE_TO_ADD_PERMISSION);
  });

  it('should return 400 and log error if exception occurs', async () => {
    mockQueryService.upermissions.mockResolvedValue('broken');
    mockPool.query.mockRejectedValue(new Error('DB error'));

    const result = await service.addUserPermissions(mockBody);

    expect(result.status).toBe(400);
    expect(result.data.code).toBe(CODE.ERROR);
    expect(result.data.message).toMatch(/DB error/);
    expect(mockLogger.error).toHaveBeenCalledWith(
      'The error in onboarding::',
      'DB error'
    );
  });
});
