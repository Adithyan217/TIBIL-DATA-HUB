// mqtt_sdk.service.spec.ts
import { Logger } from '@nestjs/common';
import { MqttSdkService } from './mqtt_sdk.service';
import { MqttMsgLogService } from './cwd-mqtt/mqtt-listener.service';
import { LoadSecretsService } from '../../load-secret/load-secret.service';

jest.mock('aws-iot-device-sdk', () => ({
  device: jest.fn(() => ({
    on: jest.fn(),
    subscribe: jest.fn(),
    publish: jest.fn(),
    end: jest.fn((_, cb) => cb && cb()),
  })),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

describe('MqttSdkService', () => {
  let service: MqttSdkService;
  let mockMsgLog: jest.Mocked<MqttMsgLogService>;
  let mockLoadSecrets: jest.Mocked<LoadSecretsService>;
  let mockDevice: any;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      MQTT_PRIVATE_KEY: 'cHJpdmF0ZUtleQ==', // base64: privateKey
      MQTT_CERT_KEY: 'Y2xpZW50Q2VydA==',    // base64: clientCert
      MQTT_CA_KEY: 'Y2FDZXJ0',              // base64: caCert
      MQTT_HOST: 'test-host',
      ENVIRONMENT: 'dev',
    };

    mockMsgLog = { processMessage: jest.fn() } as any;
    mockLoadSecrets = {} as any;

    const awsIot = require('aws-iot-device-sdk');
    mockDevice = awsIot.device();
    (awsIot.device as jest.Mock).mockReturnValue(mockDevice);
  });

  describe('constructor', () => {
    it('should skip MQTT init if SKIP_MQTT is true', () => {
      process.env.SKIP_MQTT = 'true';
      const spyWarn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
      new MqttSdkService(mockMsgLog, mockLoadSecrets);
      expect(spyWarn).toHaveBeenCalledWith(expect.stringContaining('Skipping MQTT initialization'));
    });

    it('should throw error if required env vars missing', () => {
      delete process.env.MQTT_PRIVATE_KEY;
      expect(() => new MqttSdkService(mockMsgLog, mockLoadSecrets)).toThrow(
        '❌ Missing required environment variables: PRIVATE_KEY, CERT, or CA'
      );
    });

    it('should not create tempDir if it already exists (fs.existsSync true branch)', () => {
      const fs = require('fs');
      fs.existsSync.mockReturnValue(true); // ✅ must do BEFORE creating service
      fs.mkdirSync.mockClear(); // reset calls just in case
    
      // Ensure SKIP_MQTT is not set so initializeMQTT runs
      delete process.env.SKIP_MQTT;
    
      service = new MqttSdkService(mockMsgLog, mockLoadSecrets);
    
      expect(fs.mkdirSync).not.toHaveBeenCalled(); // ✅ should now pass
    });
    
  });

  beforeEach(() => {
    // fresh instance for other tests
    const awsIot = require('aws-iot-device-sdk');
    mockDevice = awsIot.device();
    (awsIot.device as jest.Mock).mockReturnValue(mockDevice);
    service = new MqttSdkService(mockMsgLog, mockLoadSecrets);
  });

  describe('onModuleInit', () => {
    it('should log init', () => {
      const spyLog = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      service.onModuleInit();
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('MqttSdkService initialized'));
    });
  });

  describe('onModuleDestroy', () => {
    it('should call destroyConnection', () => {
      const spyDestroy = jest.spyOn<any, any>(service as any, 'destroyConnection').mockImplementation();
      service.onModuleDestroy();
      expect(spyDestroy).toHaveBeenCalled();
    });
  });

  describe('destroyConnection', () => {
    it('should end connection if device exists', () => {
      const spyLog = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      (service as any).device = mockDevice;
      (service as any).destroyConnection();
      expect(mockDevice.end).toHaveBeenCalled();
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('Closing MQTT connection'));
    });

    it('should do nothing if no device', () => {
      (service as any).device = null;
      (service as any).destroyConnection();
      expect(mockDevice.end).not.toHaveBeenCalled();
    });
  });

  describe('setupEventListeners', () => {
    it('should log error if device not initialized', () => {
      (service as any).device = null;
      const spyError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      (service as any).setupEventListeners();
      expect(spyError).toHaveBeenCalledWith(expect.stringContaining('MQTT Device is not initialized.'));
    });

    it('should attach MQTT event listeners', () => {
      const spyOn = jest.fn();
      (service as any).device = { on: spyOn };
      (service as any).setupEventListeners();
      expect(spyOn).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(spyOn).toHaveBeenCalledWith('message', expect.any(Function));
      expect(spyOn).toHaveBeenCalledWith('error', expect.any(Function));
      expect(spyOn).toHaveBeenCalledWith('close', expect.any(Function));
      expect(spyOn).toHaveBeenCalledWith('reconnect', expect.any(Function));
    });
  });

  describe('subscribeToTopics', () => {
    it('should reject if no device', async () => {
      (service as any).device = null;
      await expect(service.subscribeToTopics('topic')).rejects.toBe(false);
    });

    it('should resolve true if subscribe succeeds', async () => {
      mockDevice.subscribe.mockImplementation((t, o, cb) => cb(null, [{ topic: t }]));
      await expect(service.subscribeToTopics('topic1')).resolves.toBe(true);
    });

    it('should reject false if subscribe fails', async () => {
      mockDevice.subscribe.mockImplementation((t, o, cb) => cb(new Error('fail')));
      await expect(service.subscribeToTopics('topic1')).rejects.toBe(false);
    });
  });

  describe('publishMessage', () => {
    it('should log error if no device', () => {
      const spyError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      (service as any).device = null;
      service.publishMessage('topic', {});
      expect(spyError).toHaveBeenCalledWith(expect.stringContaining('MQTT Device is not initialized.'));
    });

    it('should publish message if device exists', () => {
      const spyLog = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      mockDevice.publish.mockImplementation((t, m, cb) => cb(null));
      (service as any).device = mockDevice;
      service.publishMessage('topic', { hello: 'world' });
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('Message published'));
    });

    it('should log publish error if publish fails', () => {
      const spyError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      mockDevice.publish.mockImplementation((t, m, cb) => cb(new Error('fail')));
      (service as any).device = mockDevice;
      service.publishMessage('topic', {});
      expect(spyError).toHaveBeenCalledWith(expect.stringContaining('Publish error'));
    });
  });

  describe('validateAndCallMfHandler', () => {
    it('should call processMessage on msgLogMqttService', () => {
      service.validateAndCallMfHandler('t1', 'payload');
      expect(mockMsgLog.processMessage).toHaveBeenCalledWith('t1', 'payload');
    });
  });
  describe('Extra coverage for missing branches', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('should run constructor happy-path when SKIP_MQTT is undefined and env vars present', () => {
      const fs = require('fs');
      fs.existsSync.mockReturnValue(false);
      fs.mkdirSync.mockClear();
      delete process.env.SKIP_MQTT; // allow initializeMQTT to run
  
      expect(() => {
        service = new MqttSdkService(mockMsgLog, mockLoadSecrets);
      }).not.toThrow();
  
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('/temp'),
        { recursive: true }
      );
    });
  
    it('subscribeToTopics should reject false if device is null', async () => {
      (service as any).device = null;
      await expect(service.subscribeToTopics('topic')).rejects.toBe(false);
    });
  
    it('subscribeToTopics should reject false if subscribe callback has error', async () => {
      (service as any).device = mockDevice;
      mockDevice.subscribe.mockImplementation((t, o, cb) => cb(new Error('fail')));
      await expect(service.subscribeToTopics('topic')).rejects.toBe(false);
    });
  
    it('publishMessage should log error when device is null', () => {
      const spyError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      (service as any).device = null;
      service.publishMessage('topic', { hello: 'world' });
      expect(spyError).toHaveBeenCalledWith(expect.stringContaining('MQTT Device is not initialized.'));
    });
  
    it('publishMessage should log error when publish callback has error', () => {
      const spyError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      (service as any).device = mockDevice;
      mockDevice.publish.mockImplementation((t, m, cb) => cb(new Error('fail')));
      service.publishMessage('topic', { hello: 'world' });
      expect(spyError).toHaveBeenCalledWith(expect.stringContaining('Publish error'));
    });
  });
  
});
