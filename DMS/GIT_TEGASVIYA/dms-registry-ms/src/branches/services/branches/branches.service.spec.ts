import { Test, TestingModule } from '@nestjs/testing';
import { BranchesService } from './branches.service';
import { QueryService } from '../query/query.service';
import { Pool } from 'pg';
import { HttpStatus } from '@nestjs/common';
import { CODE } from '../../../common/enum/common.enum';

describe('BranchesService', () => {
  let service: BranchesService;
  let mockQueryService: QueryService;
  let mockPool: Pool;

  beforeEach(async () => {
    mockQueryService = {
      getUserBranchesList: jest.fn(),
    } as any;

    mockPool = {
      query: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        { provide: QueryService, useValue: mockQueryService },
        { provide: 'DATABASE_POOL', useValue: mockPool },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return selected and available branches when data exists', async () => {
    const body = { email: 'test@example.com', bid: 'BID001' };
    const req = { user: { userName: 'admin' } };

    const mockQueryString = { query: 'SELECT ...', values: [] };
    const selectedRows = [{ id: 1 }];
    const availableRows = [{ id: 2 }];

    (mockQueryService.getUserBranchesList as jest.Mock)
      .mockResolvedValueOnce(mockQueryString) // selected
      .mockResolvedValueOnce(mockQueryString); // available

    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce({ rowCount: 1, rows: selectedRows }) // selected
      .mockResolvedValueOnce({ rowCount: 1, rows: availableRows }); // available

    const result = await service.getBranchesByUsers(body, req);

    expect(result).toEqual({
      status: HttpStatus.OK,
      data: {
        code: CODE.SUCCESS,
        selected_branches: selectedRows,
        available_branches: availableRows,
        data: [], // because you're passing [] as the 3rd arg (message)
      },
    });
    
  });

  it('should return only success with empty data when no branches found', async () => {
    const body = { email: 'test@example.com', bid: 'BID001' };
    const req = { user: { userName: 'admin' } };

    const mockQueryString = { query: 'SELECT ...', values: [] };

    (mockQueryService.getUserBranchesList as jest.Mock)
      .mockResolvedValueOnce(mockQueryString) // selected
      .mockResolvedValueOnce(mockQueryString); // available

    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // selected
      .mockResolvedValueOnce({ rowCount: 0, rows: [] }); // available

    const result = await service.getBranchesByUsers(body, req);

    expect(result).toEqual({
      status: HttpStatus.OK,
      data: {
        code: CODE.SUCCESS,
        data: [],
      },
    });
  });

  it('should handle errors and return error response', async () => {
    const body = { email: 'test@example.com', bid: 'BID001' };
    const req = { user: { userName: 'admin' } };

    const error = new Error('Database failure');
    (mockQueryService.getUserBranchesList as jest.Mock).mockRejectedValue(error);

    const result = await service.getBranchesByUsers(body, req);

    expect(result).toEqual({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      data: {
        code: CODE.ERROR,
        message: error.message,
      },
    });
  });
});
