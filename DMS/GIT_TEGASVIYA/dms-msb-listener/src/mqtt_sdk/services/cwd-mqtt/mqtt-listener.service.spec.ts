// mqtt-msg-log.service.spec.ts
import { Logger } from '@nestjs/common';
import { MqttMsgLogService } from './mqtt-listener.service';
import * as transformerModule from '../utils/transformer';
import { generateResponse, CODE } from '../enums/mqtt-msg.enum';

jest.mock('../utils/transformer', () => ({
  transform: jest.fn(),
}));

jest.mock('../enums/mqtt-msg.enum', () => ({
  CODE: { INVALID: 'INVALID', SUCCESS: 'SUCCESS' },
  generateResponse: jest.fn((code, status, msg) => ({ code, status, msg })),
}));

describe('MqttMsgLogService', () => {
  let service: MqttMsgLogService;
  let mockPool: any;
  let mockQs: any;
  let mockLs: any;
  let mockBs: any;
  let mockMqttSdk: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPool = {};
    mockQs = {};
    mockLs = { metricConfig: { listener_config: {} } };
    mockBs = { broadcastMessage: jest.fn(), addIntoBlog: jest.fn() };
    mockMqttSdk = { subscribeToTopics: jest.fn() };

    service = new MqttMsgLogService(
      mockPool,
      mockQs,
      mockLs,
      mockBs,
      mockMqttSdk,
    );
  });

  describe('processMessage', () => {
    it('should log and return if no matching config', async () => {
      const spyLog = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      mockLs.metricConfig.listener_config = {};
      await service.processMessage('topic/1', JSON.stringify({}));
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('No matching config found'));
    });

    it('should process message with matching config', async () => {
      mockLs.metricConfig.listener_config = {
        'topic/*': { transformer: {}, fnName: 'insertTxnLog' },
      };
      jest.spyOn(service, 'insertTxnLog').mockResolvedValue(undefined);
      (transformerModule.transform as jest.Mock).mockResolvedValue({ data: { ok: true } });

      await service.processMessage('topic/123', JSON.stringify({ payload: true }));
      expect(transformerModule.transform).toHaveBeenCalled();
      expect(service.insertTxnLog).toHaveBeenCalled();
    });

    it('should handle JSON parse error', async () => {
      const spyError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      await service.processMessage('topic/1', 'invalid-json');
      expect(spyError).toHaveBeenCalled();
    });

    it('should handle transform failure', async () => {
      mockLs.metricConfig.listener_config = {
        'topic/*': { transformer: {}, fnName: 'insertTxnLog' },
      };
      (transformerModule.transform as jest.Mock).mockRejectedValue(new Error('transform fail'));
      const spyError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      await service.processMessage('topic/123', JSON.stringify({}));
      expect(spyError).toHaveBeenCalled();
    });
  });

  describe('findMatchingConfig', () => {
    it('should return matching config', () => {
      const cfg = { t: true };
      const res = service.findMatchingConfig('a/b', { 'a/*': cfg });
      expect(res).toBe(cfg);
    });

    it('should return null if no match', () => {
      const res = service.findMatchingConfig('a/b', { 'x/*': {} });
      expect(res).toBeNull();
    });
  });

  describe('matchTopic', () => {
    it('should match wildcard topic', () => {
      expect(service.matchTopic('a/b', 'a/*')).toBe(true);
    });
    it('should not match topic', () => {
      expect(service.matchTopic('a/b', 'x/*')).toBe(false);
    });
    it('should match <imei>', () => {
      expect(service.matchTopic('a/123', 'a/<imei>')).toBe(true);
    });
  });

  describe('extractIMEI', () => {
    it('should return imei from *', async () => {
      mockLs.metricConfig.listener_config = { 'a/*': {} };
      const imei = await service.extractIMEI('a/123');
      expect(imei).toBe('123');
    });

    it('should return imei from <imei>', async () => {
      mockLs.metricConfig.listener_config = { 'a/<imei>': {} };
      const imei = await service.extractIMEI('a/999');
      expect(imei).toBe('999');
    });

    it('should return unknown if no pattern match', async () => {
      mockLs.metricConfig.listener_config = { 'x/*': {} };
      const imei = await service.extractIMEI('a/123');
      expect(imei).toBe('unknown');
    });
  });

  describe('insertTxnLog', () => {
    it('should broadcast and addIntoBlog', async () => {
      await service.insertTxnLog('imei1', { rrn: 'r1', money: 100 });
      expect(mockBs.broadcastMessage).toHaveBeenCalledWith('r1', 100, 'imei1');
      expect(mockBs.addIntoBlog).toHaveBeenCalledWith('r1', 100, 'imei1');
    });
  });

  describe('getTopicForManufacturer', () => {
    it('should return success when topic found and subscribed', async () => {
      mockLs.metricConfig.listener_config = { mf: 'a/*' };
      jest.spyOn(service, 'replaceWildcardWithValue').mockReturnValue('a/imei1');
      mockMqttSdk.subscribeToTopics.mockResolvedValue(true);

      const res = await service.getTopicForManufacturer('mf', 'imei1');
      expect(res.status).toBe(CODE.SUCCESS);
    });

    it('should return fail when topic found but subscribe fails', async () => {
      mockLs.metricConfig.listener_config = { mf: 'a/*' };
      jest.spyOn(service, 'replaceWildcardWithValue').mockReturnValue('a/imei1');
      mockMqttSdk.subscribeToTopics.mockResolvedValue(false);

      const res = await service.getTopicForManufacturer('mf', 'imei1');
      expect(res.status).toBe(CODE.INVALID);
    });

    it('should return topic not found', async () => {
      mockLs.metricConfig.listener_config = {};
      const res = await service.getTopicForManufacturer('mf', 'imei1');
      expect(res.status).toBe(CODE.INVALID);
    });

    it('should return no matching config found', async () => {
      mockLs.metricConfig.listener_config = { mf: 'a/*' };
      jest.spyOn(service, 'replaceWildcardWithValue').mockReturnValue('');
      const res = await service.getTopicForManufacturer('mf', 'imei1');
      expect(res.status).toBe(CODE.INVALID);
    });
  });

  describe('replaceWildcardWithValue', () => {
    it('should replace wildcard', () => {
      expect(service.replaceWildcardWithValue('a/*/b', 'X')).toBe('a/X/b');
    });
  });
});
