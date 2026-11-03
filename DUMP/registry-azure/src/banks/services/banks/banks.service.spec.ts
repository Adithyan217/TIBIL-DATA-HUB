import { Test, TestingModule } from '@nestjs/testing';
import { BanksService } from './banks.service';
import { QueryService } from '../query/query.service';
import { Pool } from 'pg';
import { CODE } from '../../../common/enum/common.enum';
import { HttpStatus } from '@nestjs/common';

describe('BanksService', () => {
  let service: BanksService;
  let mockQueryService: Partial<QueryService>;
  let mockPool: Partial<Pool>;

  const body = { email: 'test@example.com' };
  const req = { user: { userName: 'admin' } };

  beforeEach(async () => {
    mockQueryService = {
      getUserBanksList: jest.fn(),
    };

    mockPool = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BanksService,
        { provide: QueryService, useValue: mockQueryService },
        { provide: 'DATABASE_POOL', useValue: mockPool },
      ],
    }).compile();

    service = module.get<BanksService>(BanksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return selected and available banks when data exists', async () => {
    const selectedRows = [{ id: 1 }];
    const availableRows = [{ id: 2 }];

    (mockQueryService.getUserBanksList as jest.Mock)
      .mockResolvedValueOnce({ query: 'QUERY1', values: [] })
      .mockResolvedValueOnce({ query: 'QUERY2', values: [] });

    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce({ rowCount: 1, rows: selectedRows })
      .mockResolvedValueOnce({ rowCount: 1, rows: availableRows });

    const result = await service.getBanksByUsers(body, req);

    expect(result).toEqual({
      status: HttpStatus.OK,
      data: {
        code: CODE.SUCCESS,
        selected_banks: selectedRows,
        available_banks: availableRows,
        data: [], // because you're passing [] as the 3rd arg (message)
      },
    });
  });

  it('should return only success with no data when no banks found', async () => {
    (mockQueryService.getUserBanksList as jest.Mock)
      .mockResolvedValueOnce({ query: 'QUERY1', values: [] })
      .mockResolvedValueOnce({ query: 'QUERY2', values: [] });

    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const result = await service.getBanksByUsers(body, req);

    expect(result).toEqual({
      status: HttpStatus.OK,
      data: {
        code: CODE.SUCCESS,
        data: [],
      },
    });
  });

  it('should handle errors and return error response', async () => {
    const error = new Error('Database failure');

    (mockQueryService.getUserBanksList as jest.Mock).mockRejectedValue(error);

    const result = await service.getBanksByUsers(body, req);

    expect(result).toEqual({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      data: {
        code: CODE.ERROR,
        message: error.message,
      },
    });
  });
});
