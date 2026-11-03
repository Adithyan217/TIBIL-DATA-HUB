import { MqttListenerService } from './mqtt-listener.service';
import { listnerQueryService } from '../queries/pnotif-queries';
import { LoadSecretsService } from 'src/load-secret/load-secret.service';
import { transform } from '../utils/transformer';
import { symEncryptor } from '../utils/encryptor';
import { symDecryptor } from '../utils/decryptor';
import { FileLogger } from '../utils/file-logger';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, of } from 'rxjs';

jest.mock('../utils/transformer', () => ({
  transform: jest.fn(),
}));

jest.mock('../utils/encryptor', () => ({
  symEncryptor: jest.fn(),
}));

jest.mock('../utils/decryptor', () => ({
  symDecryptor: jest.fn(),
}));

jest.mock('../utils/file-logger', () => ({
  FileLogger: { log: jest.fn() },
}));

jest.mock('@nestjs/axios', () => ({
  HttpService: jest.fn().mockImplementation(() => ({
    post: jest.fn(),
  })),
}));

jest.mock('rxjs', () => ({
  ...(jest.requireActual('rxjs') as any),
  lastValueFrom: jest.fn(),
}));

describe('MqttListenerService', () => {
  let service: MqttListenerService;
  let mockPool: any;
  let mockQs: any;
  let mockLs: any;
  let mockHttp: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPool = {};
    mockQs = {};
    mockLs = { envSecrets: { pcwd: JSON.stringify({ security: 'sec-key', cwd_url: 'http://cwd' }) } };
    mockHttp = new HttpService();
    service = new MqttListenerService(mockPool, mockQs as any, mockLs as any, mockHttp);
  });

  describe('processMessage', () => {
    it('should process /in/transaction topic', async () => {
      (transform as jest.Mock).mockResolvedValue({ data: { test: 'value' } });
      jest.spyOn(service, 'encryptMsgAndCallCwd').mockResolvedValue(undefined);

      await service.processMessage('/topic/in/transaction', JSON.stringify({ foo: 'bar' }));

      expect(transform).toHaveBeenCalled();
      expect(service.encryptMsgAndCallCwd).toHaveBeenCalledWith({ test: 'value' });
    });

    it('should log error if JSON parse fails', async () => {
      const logSpy = jest.spyOn(service['logger'], 'error').mockImplementation();
      await service.processMessage('/topic/in/transaction', 'invalid-json');
      expect(logSpy).toHaveBeenCalled();
    });
  });

  describe('findMatchingConfig', () => {
    it('should return matching config', () => {
      const config = { 'device/*': { id: 1 } };
      expect(service.findMatchingConfig('device/abc', config)).toEqual({ id: 1 });
    });

    it('should return null if no match', () => {
      const config = { 'other/*': { id: 1 } };
      expect(service.findMatchingConfig('device/abc', config)).toBeNull();
    });
  });

  describe('matchTopic', () => {
    it('should match * wildcard', () => {
      expect(service.matchTopic('device/123', 'device/*')).toBe(true);
    });

    it('should match <imei> placeholder', () => {
      expect(service.matchTopic('device/12345', 'device/<imei>')).toBe(true);
    });

    it('should not match', () => {
      expect(service.matchTopic('device/abc', 'other/<imei>')).toBe(false);
    });
  });

  describe('encryptMsgAndCallCwd', () => {
    it('should encrypt, call API, decrypt and log success', async () => {
      (symEncryptor as jest.Mock).mockResolvedValue({ code: 200, data: 'encrypted' });
      (lastValueFrom as jest.Mock).mockResolvedValue({ status: 200, data: { data: 'resp-encrypted' } });
      (symDecryptor as jest.Mock).mockResolvedValue({ data: { ok: true } });

      await service.encryptMsgAndCallCwd({ reqRefNo: '123', deviceId: '1' });

      expect(symEncryptor).toHaveBeenCalled();
      expect(symDecryptor).toHaveBeenCalled();
      expect(FileLogger.log).toHaveBeenCalled();
    });

    it('should handle API error response', async () => {
      (symEncryptor as jest.Mock).mockResolvedValue({ code: 200, data: 'encrypted' });
      (lastValueFrom as jest.Mock).mockResolvedValue({ status: 400, data: { data: 'resp-encrypted' } });
      (symDecryptor as jest.Mock).mockResolvedValue({ data: { error: true } });

      await service.encryptMsgAndCallCwd({ reqRefNo: '123', deviceId: '1' });

      expect(FileLogger.log).toHaveBeenCalled();
    });

    it('should handle encryption failure', async () => {
      (symEncryptor as jest.Mock).mockRejectedValue(new Error('fail'));
      const logSpy = jest.spyOn(service['logger'], 'error').mockImplementation();

      await service.encryptMsgAndCallCwd({ reqRefNo: '123', deviceId: '1' });

      expect(logSpy).toHaveBeenCalled();
      expect(FileLogger.log).toHaveBeenCalled();
    });
  });

  describe('writeIntoResponseLog', () => {
    it('should write correct log message', () => {
      service.writeIntoResponseLog('req-123', { foo: 'bar' });
      expect(FileLogger.log).toHaveBeenCalledWith('req-123,  {"foo":"bar"}');
    });
  });
});
