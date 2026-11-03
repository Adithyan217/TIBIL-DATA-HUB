import { Test, TestingModule } from '@nestjs/testing';
import { CwdMqttService } from './mqtt-listener.service';
import { Pool } from 'pg';
import { listnerQueryService } from '../queries/pnotif-queries';
import { LoadSecretsService } from '../../../load-secret/load-secret.service';
import { broker_device_msg } from '../enums/mqtt-msg.enum';
import { Logger } from '@nestjs/common';

jest.mock('../utils/transformer', () => ({
  transform: jest.fn(),
}));

import { transform } from '../utils/transformer';

describe('CwdMqttService', () => {
  let service: CwdMqttService;
  let mockPool;
  let mockQueryService;
  let mockLoadSecretsService;

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    mockPool = { query: jest.fn() };
    mockQueryService = {
      insertMsgIntoPlog: jest.fn(),
      updateAckStatus: jest.fn(),
      insertMetricsIntoDB: jest.fn(),
    };
    mockLoadSecretsService = {
      metricConfig: {
        listener_config: {
          'txn/<imei>/ack': {
            fnName: 'updateTxnLog',
            transformer: { fields: ['rrn', 'status'] }
          },
          'txn/<imei>/log': {
            fnName: 'insertTxnLog',
            transformer: { fields: ['rrn', 'money'] }
          },
          'metrics/<imei>': {
            fnName: 'insertMetrics',
            transformer: {}
          }
        }
      }
    };

    const module: TestingModule = await Test.createTestingModule({
                                                                   providers: [
                                                                     CwdMqttService,
                                                                     { provide: 'DATABASE_POOL', useValue: mockPool },
                                                                     { provide: listnerQueryService, useValue: mockQueryService },
                                                                     { provide: LoadSecretsService, useValue: mockLoadSecretsService },
                                                                   ],
                                                                 }).compile();

    service = module.get<CwdMqttService>(CwdMqttService);
  });

  describe('matchTopic', () => {
    it('should match wildcard topic pattern', () => {
      expect(service.matchTopic('txn/1234567890/ack', 'txn/<imei>/ack')).toBe(true);
    });

    it('should not match incorrect topic', () => {
      expect(service.matchTopic('txn/ack/1234', 'txn/<imei>/ack')).toBe(false);
    });
  });

  describe('extractIMEI', () => {
    it('should extract imei from topic', async () => {
      const imei = await service.extractIMEI('txn/1234567890/ack');
      expect(imei).toBe('1234567890');
    });
  });

  describe('insertTxnLog', () => {
    it('should insert transaction log and return row', async () => {
      const mockQuery = 'INSERT INTO plog ...';
      const mockRow = { rrn: '123', imei: '1234567890', money: 50 };
      mockQueryService.insertMsgIntoPlog.mockResolvedValue(mockQuery);
      mockPool.query.mockResolvedValueOnce({ rowCount: 1, rows: [mockRow] });

      const result = await service.insertTxnLog('1234567890', { rrn: '123', money: 50 });
      expect(result).toEqual(mockRow);
    });
  });

  describe('updateTxnLog', () => {
    it('should update transaction log status', async () => {
      const mockQuery = 'UPDATE ...';
      mockQueryService.updateAckStatus.mockResolvedValue(mockQuery);
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });
      await service.updateTxnLog('1234567890', { rrn: '123', status: 'S' });
      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('insertMetrics', () => {
    it('should insert metrics successfully', async () => {
      const mockQuery = 'INSERT INTO metrics ...';
      mockQueryService.insertMetricsIntoDB.mockResolvedValue(mockQuery);
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });
      await service.insertMetrics('1234567890', { latency: 200 });
      expect(mockPool.query).toHaveBeenCalledWith(mockQuery, ['1234567890', { latency: 200 }]);
    });
  });

  describe('processMessage', () => {
    it('should process a known topic and call the appropriate function', async () => {
      const spy = jest.spyOn(service, 'updateTxnLog').mockImplementation(async () => {});
      const payload = JSON.stringify({ rrn: '123', status: 'S' });

      (transform as jest.Mock).mockResolvedValueOnce({
                                                       data: { rrn: '123', status: 'S' },
                                                     });

      await service.processMessage('txn/1234567890/ack', payload);

      expect(spy).toHaveBeenCalledWith('1234567890', {
        rrn: '123',
        status: 'S',
      });
    });

    it('should log error if transformer fails', async () => {
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error');

      const badPayload = 'invalid-json'; // Not valid JSON string

      await service.processMessage('txn/1234567890/ack', badPayload);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('❌ Error processing message: Unexpected token'),
      );
    });


    it('should return if no matching config', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await service.processMessage('unknown/topic', JSON.stringify({}));

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No matching config found'));
    });
  });

});
