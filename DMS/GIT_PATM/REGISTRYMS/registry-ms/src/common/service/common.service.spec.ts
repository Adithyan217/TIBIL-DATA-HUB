import { Test, TestingModule } from '@nestjs/testing';
import { CommonService } from './common.service';
import { Pool } from 'pg';
import { CommonqueryService } from './commonquery.service';
import { commonEnum } from '../enum/common.enum';
import { WinstonLoggerService } from "./winstonlogger/winstonlogger.service";

describe('CommonService', () => {
  let service: CommonService;
  let pool: any;
  let qs: any;
  let mockLogger: { error: jest.Mock, warn: jest.Mock, log: jest.Mock };

  beforeEach(async () => {
    pool = { query: jest.fn() };
    qs = {
      entityQuery: jest.fn(),
      getEntityDetailsQuery: jest.fn(),
      getFilteredData: jest.fn(),
      getBankList: jest.fn(),
      getBranchList: jest.fn(),
      getMerchantQuery: jest.fn(),
      getVpaQuery: jest.fn(),
      check: jest.fn(),
      policy: jest.fn(),
      status: jest.fn(),
      upermissions: jest.fn(),
      getorgs: jest.fn(),
      getMerchantTypes: jest.fn(),
      getSimProviders: jest.fn(),
      getUserList: jest.fn()
    };

    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
                                                                   providers: [
                                                                     CommonService,
                                                                     { provide: 'DATABASE_POOL', useValue: pool },
                                                                     { provide: CommonqueryService, useValue: qs },
                                                                     { provide: WinstonLoggerService, useValue: mockLogger },
                                                                   ],
                                                                 }).compile();

    service = module.get<CommonService>(CommonService);
  });

  // Test: getOrgRoles - Success
  it('should return success for getOrgRoles', async () => {
    qs.getorgs.mockResolvedValueOnce('SELECT * FROM roles');
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ role: 'admin' }] });
    const res = await service.getOrgRoles();
    expect(res).toEqual({
                          status: 200,
                          data: {
                            code: commonEnum.SUCCESS_CODE,
                            data: [{ role: 'admin' }],
                          },
                        });
  });

  // Test: getOrgRoles - No records
  it('should return failure for getOrgRoles when no records', async () => {
    qs.getorgs.mockResolvedValueOnce('SELECT * FROM roles');
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const res = await service.getOrgRoles();
    expect(res).toEqual({
                          status: 200,
                          data: {
                            code: commonEnum.SUCCESS_CODE,
                            data: [],
                          },
                        });
  });

  // Test: getOrgRoles - Error
  it('should return error for getOrgRoles on exception', async () => {
    qs.getorgs.mockRejectedValueOnce(new Error('DB error'));
    const res = await service.getOrgRoles();
    expect(res).toEqual({
                          status: 400,
                          data: {
                            code: commonEnum.FAILURE_CODE,
                            message: 'DB error',
                          },
                        });
  });

  // Test: getStatus - Success
  it('should return success from getStatus', async () => {
    qs.status.mockResolvedValueOnce({ query: 'select status from table', values: [] });
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ status: 'active' }] });
    const result = await service.getStatus({});
    expect(result).toEqual({
                             status: 200,
                             data: {
                               code: commonEnum.SUCCESS_CODE,
                               data: ['active'],
                             },
                           });
  });

  // Test: getStatus - No rows
  it('should return failure from getStatus with no rows', async () => {
    qs.status.mockResolvedValueOnce({ query: 'select status from table', values: [] });
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const result = await service.getStatus({});
    expect(result).toEqual({
                             status: 200,
                             data: {
                               code: commonEnum.SUCCESS_CODE,
                               data: [],
                             },
                           });
  });

  // Test: getStatus - Error
  it('should return error from getStatus on exception', async () => {
    qs.status.mockResolvedValueOnce({ query: 'select status from table', values: [] });
    pool.query.mockRejectedValueOnce(new Error('Status query error'));
    const result = await service.getStatus({});
    expect(result).toEqual({
                             status: 400,
                             data: {
                               code: commonEnum.FAILURE_CODE,
                               message: 'Status query error',
                             },
                           });
  });

  // Test: getEntityDetailsExecution - Count > 0
  it('should return entity details with count > 0', async () => {
    qs.entityQuery.mockReturnValueOnce({ query: 'count-query', value: [] });
    pool.query.mockResolvedValueOnce({ rows: [{ count: 2 }] });
    qs.entityQuery.mockReturnValueOnce({ query: 'data-query', value: [] });
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] });
    const result = await service.getEntityDetailsExecution({}, 'context');
    expect(result).toEqual({
                             status: 200,
                             data: {
                               code: commonEnum.SUCCESS_CODE,
                               count: 2,
                               data: [{ id: 1 }, { id: 2 }],
                             },
                           });
  });

  // Test: getEntityDetailsExecution - Count 0
  it('should return no records for entity details with count 0', async () => {
    qs.entityQuery.mockReturnValueOnce({ query: 'count-query', value: [] });
    pool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
    const result = await service.getEntityDetailsExecution({}, 'context');
    expect(result).toEqual({
                             status: 200,
                             data: {
                               code: commonEnum.SUCCESS_CODE,
                               data: [],
                             },
                           });
  });

  // Test: getEntityDetailsExecution - Error
  it('should return error from getEntityDetailsExecution on exception', async () => {
    qs.entityQuery.mockImplementation(() => { throw new Error('DB error'); });
    const result = await service.getEntityDetailsExecution({}, 'context');
    expect(result).toEqual({
                             status: 400,
                             data: {
                               code: commonEnum.FAILURE_CODE,
                               message: 'DB error',
                             },
                           });
  });

  // Test: getDevicesExecution - Count > 0
  it('should return devices when count > 0', async () => {
    qs.getFilteredData.mockReturnValueOnce({ query: 'count-query', values: [] });
    pool.query.mockResolvedValueOnce({ rows: [{ count: 1 }] });
    qs.getFilteredData.mockReturnValueOnce({ query: 'data-query', values: [] });
    pool.query.mockResolvedValueOnce({ rows: [{ device_id: 'D001' }] });
    const result = await service.getDevicesExecution({ filter: {}, pagination: {}, role: 'admin', userName: 'user1' });
    expect(result).toEqual({
                             status: 200,
                             data: {
                               code: commonEnum.SUCCESS_CODE,
                               count: 1,
                               data: [{ device_id: 'D001' }],
                             },
                           });
  });

  // Test: getDevicesExecution - No devices found
  it('should return failure when no devices found', async () => {
    qs.getFilteredData.mockReturnValueOnce({ query: 'count-query', values: [] });
    pool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
    const result = await service.getDevicesExecution({ filter: {}, pagination: {}, role: 'admin', userName: 'user1' });
    expect(result).toEqual({
                             status: 200,
                             data: {
                               code: commonEnum.SUCCESS_CODE,
                               data: [],
                             },
                           });
  });

  // Test: getDevicesExecution - Error
  it('should return error from getDevicesExecution on exception', async () => {
    qs.getFilteredData.mockImplementation(() => { throw new Error('DB error'); });
    const result = await service.getDevicesExecution({ filter: {}, pagination: {}, role: 'admin', userName: 'user1' });
    expect(result).toEqual({
                             status: 400,
                             data: {
                               code: commonEnum.FAILURE_CODE,
                               message: 'DB error',
                             },
                           });
  });

  // Test: getMerchantTypes - Success
  it('should return merchant types on success', async () => {
    qs.getMerchantTypes.mockResolvedValueOnce('SELECT * FROM merchant_types');
    pool.query.mockResolvedValueOnce({ rowCount: 2, rows: [{ id: 1 }, { id: 2 }] });

    const res = await service.getMerchantTypes();
    expect(res).toEqual({
                          status: 200,
                          data: {
                            code: commonEnum.SUCCESS_CODE,
                            data: [{ id: 1 }, { id: 2 }],
                          },
                        });
  });

  // Test: getMerchantTypes - No rows
  it('should return empty array when no merchant types found', async () => {
    qs.getMerchantTypes.mockResolvedValueOnce('SELECT * FROM merchant_types');
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const res = await service.getMerchantTypes();
    expect(res).toEqual({
                          status: 200,
                          data: {
                            code: commonEnum.SUCCESS_CODE,
                            data: [],
                          },
                        });
  });

  // Test: getMerchantTypes - Error
  it('should handle error in getMerchantTypes', async () => {
    qs.getMerchantTypes.mockRejectedValueOnce(new Error('DB error'));

    const res = await service.getMerchantTypes();
    expect(mockLogger.error).toHaveBeenCalledWith('DB error');
    expect(res).toEqual({
                          status: 400,
                          data: {
                            code: commonEnum.FAILURE_CODE,
                            message: 'DB error',
                          },
                        });
  });

  // Test: getSimProviders - Success
  it('should return sim providers on success', async () => {
    qs.getSimProviders.mockResolvedValueOnce('SELECT * FROM sim_providers');
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'sp1' }] });

    const res = await service.getSimProviders();
    expect(res).toEqual({
                          status: 200,
                          data: {
                            code: commonEnum.SUCCESS_CODE,
                            data: [{ id: 'sp1' }],
                          },
                        });
  });

  // Test: getSimProviders - No data
  it('should return empty array when no sim providers found', async () => {
    qs.getSimProviders.mockResolvedValueOnce('SELECT * FROM sim_providers');
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const res = await service.getSimProviders();
    expect(res).toEqual({
                          status: 200,
                          data: {
                            code: commonEnum.SUCCESS_CODE,
                            data: [],
                          },
                        });
  });

  // Test: getSimProviders - Error
  it('should handle error in getSimProviders', async () => {
    qs.getSimProviders.mockRejectedValueOnce(new Error('DB error'));

    const res = await service.getSimProviders();
    expect(mockLogger.error).toHaveBeenCalledWith('DB error');
    expect(res).toEqual({
                          status: 400,
                          data: {
                            code: commonEnum.FAILURE_CODE,
                            message: 'DB error',
                          },
                        });
  });

  // Test: getUserList with count > 0
  it('should return user list when count > 0', async () => {
    const inputData = { filter: 'some-filter' };
    qs.getUserList.mockResolvedValueOnce({ query: 'count query', values: [] });
    pool.query.mockResolvedValueOnce({ rows: [{ count: 5 }] });
    qs.getUserList.mockResolvedValueOnce({ query: 'data query', values: [] });
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'User1' }] });

    const res = await service.getUserList(inputData);
    expect(res).toEqual({
                          status: 200,
                          data: {
                            code: commonEnum.SUCCESS_CODE,
                            data: [{ id: 1, name: 'User1' }],
                            count: 5,
                          },
                        });
  });

  // Test: getUserList with count 0
  it('should return empty user list when count is zero', async () => {
    const inputData = { filter: 'some-filter' };
    qs.getUserList.mockResolvedValueOnce({ query: 'count query', values: [] });
    pool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });

    const res = await service.getUserList(inputData);
    expect(res).toEqual({
                          status: 200,
                          data: {
                            code: commonEnum.SUCCESS_CODE,
                            data: [],
                          },
                        });
  });

  // Test: getUserList error
  it('should handle error in getUserList', async () => {
    const inputData = { filter: 'some-filter' };
    qs.getUserList.mockRejectedValueOnce(new Error('DB error'));

    const res = await service.getUserList(inputData);
    expect(mockLogger.error).toHaveBeenCalledWith('DB error');
    expect(res).toEqual({
                          status: 400,
                          data: {
                            code: commonEnum.FAILURE_CODE,
                            message: 'DB error',
                          },
                        });
  });
});
