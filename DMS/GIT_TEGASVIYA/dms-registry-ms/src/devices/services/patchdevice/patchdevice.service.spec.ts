import { Test, TestingModule } from '@nestjs/testing';
import { PatchdeviceService } from './patchdevice.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { QueryService } from '../query/query.services';
import { WinstonLoggerService } from '../../../common/service/winstonlogger/winstonlogger.service';
import { AwsmqttService } from '../../../common/service/mqtt/awsmqtt.service';
import { Pool } from 'pg';
import { HttpStatus } from '@nestjs/common';
import { CODE } from '../../../common/enum/common.enum';

describe('PatchDeviceService', () => {
  let service: PatchdeviceService;
  let mockPool: any;
  let mockQueryService: Partial<QueryService>;
  let mockLogger: Partial<WinstonLoggerService>;
  let mockHttpService: Partial<HttpService>;
  let mockMqtt: Partial<AwsmqttService>;

  beforeEach(async () => {
    mockPool = {
      query: jest.fn(),
    };

    mockQueryService = {
      updateDevice: jest.fn(),
      getDeviceRoutes: jest.fn(),
    };

    mockLogger = {
      error: jest.fn(),
    };

    mockHttpService = {
      post: jest.fn(),
    };

    mockMqtt = {
      publishMessage: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
                                                                   providers: [
                                                                     PatchdeviceService,
                                                                     { provide: 'DATABASE_POOL', useValue: mockPool },
                                                                     { provide: AwsmqttService, useValue: mockMqtt },
                                                                     { provide: WinstonLoggerService, useValue: mockLogger },
                                                                     { provide: HttpService, useValue: mockHttpService },
                                                                     { provide: QueryService, useValue: mockQueryService },
                                                                   ],
                                                                 }).compile();

    service = module.get<PatchdeviceService>(PatchdeviceService);

    // Mock environment
    process.env["AXIOS-URL"] = 'http://localhost:3000';
    process.env["MQTT-BROKER"] = 'AWS_IOT_CORE';
  });

  it('should return success when device updated', async () => {
    const data = { eid: 'eid123', edetails: [{ device_id: 'dev1' }] };

    const mockQuery = { query: 'UPDATE ...', values: [1] };
    (mockQueryService.updateDevice as jest.Mock).mockResolvedValue(mockQuery);
    mockPool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 1 }] });


    const result = await service.updateDevice(data);
    expect(result.status).toBe(HttpStatus.OK);
    expect(result.data.code).toBe(CODE.SUCCESS);
  });

  it('should return invalid message when no rows affected', async () => {
    const data = { eid: 'eid123', edetails: [{}] };
    (mockQueryService.updateDevice as jest.Mock).mockResolvedValue({ query: '', values: [] });
    mockPool.query.mockResolvedValue({ rowCount: 0 });

    const result = await service.updateDevice(data);
    expect(result.data.code).toBe(CODE.ERROR);
  });

  it('should handle updateDevice exception', async () => {
    (mockQueryService.updateDevice as jest.Mock).mockRejectedValue(new Error('fail'));
    const result = await service.updateDevice({ edetails: [{}] });
    expect(result.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('should simulate payment with success', async () => {
    const data = { eid: 'eid123', edetails: [{ device_id: 'dev1', txt_amt: 99 }] };

    (mockQueryService.getDeviceRoutes as jest.Mock).mockResolvedValue({ query: 'SELECT', values: [] });
    mockPool.query.mockResolvedValue({ rows: [{ rcontext: 'ctx', imei: '1234', dname: 'd1' }] });

    mockHttpService.post = jest.fn().mockReturnValue(
        of({
             status: HttpStatus.OK,
             data: {
               code: HttpStatus.OK,
               data: {
                 payload_request: { test: 'payload' },
                 mqtt_topic: 'topic/test',
               },
             },
           }),
    );

    const result = await service.simulatePayments(data);
    expect(result.status).toBe(HttpStatus.OK);
    expect(result.data.data).toEqual([]);
    expect(result.data.edata.status).toEqual([1, 1, 0]);
  });

  it('should handle simulatePayments exception', async () => {
    (mockQueryService.getDeviceRoutes as jest.Mock).mockRejectedValue(new Error('DB Error'));
    const result = await service.simulatePayments({ edetails: [{ device_id: 'd1' }] });
    expect(result.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  });

});
