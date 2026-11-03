import { Test, TestingModule } from '@nestjs/testing';
import { GetmfService } from './getmf.service';
import { QueryService } from '../query/query.service';
import { WinstonLoggerService } from '../../../common/service/winstonlogger/winstonlogger.service';
import { HttpStatus } from '@nestjs/common';
import { CODE } from '../../../common/enum/common.enum';

describe('GetmfService', () => {
  let service: GetmfService;
  let mockQueryService: Partial<QueryService>;
  let mockLoggerService: Partial<WinstonLoggerService>;
  let mockPool: any;

  beforeEach(async () => {
    mockQueryService = {
      getMfLanguges: jest.fn(),
    };

    mockLoggerService = {
      error: jest.fn(),
    };

    mockPool = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
                                                                   providers: [
                                                                     GetmfService,
                                                                     { provide: 'DATABASE_POOL', useValue: mockPool },
                                                                     { provide: WinstonLoggerService, useValue: mockLoggerService },
                                                                     { provide: QueryService, useValue: mockQueryService },
                                                                   ],
                                                                 }).compile();

    service = module.get<GetmfService>(GetmfService);
  });

  it('should return rows when query has results', async () => {
    const mockBody = { mfid: 'mf001' };
    const mockRows = [{ id: 1, lang: 'en' }];
    (mockQueryService.getMfLanguges as jest.Mock).mockResolvedValue({
                                                                      query: 'SELECT * FROM langs WHERE mfid = $1',
                                                                      values: [mockBody.mfid],
                                                                    });
    mockPool.query.mockResolvedValue({ rows: mockRows });

    const result = await service.getMfLanguages(mockBody);

    expect(result).toEqual({ data: {
            code: CODE.SUCCESS,

            data: mockRows,
        }, status: HttpStatus.OK} );
    expect(mockQueryService.getMfLanguges).toHaveBeenCalledWith(mockBody.mfid);
    expect(mockPool.query).toHaveBeenCalled();
  });

  it('should return empty array when no rows found', async () => {
    const mockBody = { mfid: 'mf002' };
    (mockQueryService.getMfLanguges as jest.Mock).mockResolvedValue({
                                                                      query: 'SELECT * FROM langs WHERE mfid = $1',
                                                                      values: [mockBody.mfid],
                                                                    });
    mockPool.query.mockResolvedValue({ rows: [] });

    const result = await service.getMfLanguages(mockBody);

    expect(result).toEqual({ data: {
            code: CODE.SUCCESS,

            data: [],
        }, status: HttpStatus.OK}  );
  });

  it('should handle and log errors', async () => {
    const mockBody = { mfid: 'mf999' };
    const error = new Error('Database connection failed');
    (mockQueryService.getMfLanguges as jest.Mock).mockRejectedValue(error);

    const result = await service.getMfLanguages(mockBody);

    expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('getmf languages error:'),
    );
    expect(result).toEqual( {
                                data : {
                                    code : CODE.SUCCESS ,
                                    data : [] ,
                                } , status : HttpStatus.INTERNAL_SERVER_ERROR  } );
  });
});
