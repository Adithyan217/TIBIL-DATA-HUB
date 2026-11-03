import { MqttSdkService } from './mqtt_sdk.service';
import { MqttListenerService } from './mqtt-listener/mqtt-listener.service';
import { LoadSecretsService } from 'src/load-secret/load-secret.service';
import * as awsIot from 'aws-iot-device-sdk';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('aws-iot-device-sdk', () => ({
  device: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    end: jest.fn(),
    subscribe: jest.fn(),
    publish: jest.fn(),
  })),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe('MqttSdkService', () => {
  let service: MqttSdkService;
  let mockListener: jest.Mocked<MqttListenerService>;
  let mockLoadSecrets: jest.Mocked<LoadSecretsService>;
  let mockDevice: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockListener = { processMessage: jest.fn() } as any;
    mockLoadSecrets = {
      metricConfig: { listener_config: { topics: ['topic1', 'topic2'] } },
    } as any;

    process.env.MQTT_PRIVATE_KEY = Buffer.from('private-key').toString('base64');
    process.env.MQTT_CERT_KEY = Buffer.from('cert-key').toString('base64');
    process.env.MQTT_CA_KEY = Buffer.from('ca-key').toString('base64');
    process.env.ENVIRONMENT = 'test';
    process.env.MQTT_HOST = 'test-host';

    mockDevice = {
      on: jest.fn(),
      end: jest.fn((_, cb) => cb && cb()),
      subscribe: jest.fn((_, cb) => cb && cb(null, [{ topic: 'topic1' }])),
      publish: jest.fn((_, __, cb) => cb && cb()),
    };
    (awsIot.device as jest.Mock).mockReturnValue(mockDevice);

    (fs.existsSync as jest.Mock).mockReturnValue(false);

    service = new MqttSdkService(mockListener, mockLoadSecrets);
  });

  describe('initializeMQTT', () => {
    it('should create tempDir if it does not exist', () => {
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });

    it('should not create tempDir if it already exists', () => {
      jest.clearAllMocks();
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      new MqttSdkService(mockListener, mockLoadSecrets);
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should throw error if env vars missing', () => {
      delete process.env.MQTT_PRIVATE_KEY;
      expect(() => new MqttSdkService(mockListener, mockLoadSecrets)).toThrow();
    });
  });

  describe('onModuleInit / onModuleDestroy', () => {
    it('should log on init', () => {
      const logSpy = jest.spyOn(service['logger'], 'log').mockImplementation();
      service.onModuleInit();
      expect(logSpy).toHaveBeenCalledWith('🚀 MqttSdkService initialized');
    });

    it('should call destroyConnection on destroy', () => {
      const destroySpy = jest.spyOn<any, any>(service, 'destroyConnection').mockImplementation();
      service.onModuleDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('destroyConnection', () => {
    it('should end MQTT connection if device exists', () => {
      service['device'] = mockDevice;
      service['destroyConnection']();
      expect(mockDevice.end).toHaveBeenCalled();
      expect(service['device']).toBeNull();
    });

    it('should do nothing if no device', () => {
      service['device'] = null;
      service['destroyConnection']();
      expect(mockDevice.end).not.toHaveBeenCalled();
    });
  });

  describe('setupEventListeners', () => {
    it('should log error if no device', () => {
      service['device'] = null;
      const errorSpy = jest.spyOn(service['logger'], 'error').mockImplementation();
      service['setupEventListeners']();
      expect(errorSpy).toHaveBeenCalledWith('❌ MQTT Device is not initialized.');
    });

    it('should register event listeners when device exists', () => {
      service['device'] = mockDevice;
      service['setupEventListeners']();
      expect(mockDevice.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockDevice.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockDevice.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockDevice.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockDevice.on).toHaveBeenCalledWith('reconnect', expect.any(Function));
    });
  });

  describe('subscribeToTopics', () => {
    it('should log error if no device', () => {
      service['device'] = null;
      const errorSpy = jest.spyOn(service['logger'], 'error').mockImplementation();
      service['subscribeToTopics']();
      expect(errorSpy).toHaveBeenCalledWith('❌ MQTT Device is not initialized.');
    });

    it('should subscribe to topics', () => {
      service['device'] = mockDevice;
      service['subscribeToTopics']();
      expect(mockDevice.subscribe).toHaveBeenCalledWith('topic1', expect.any(Function));
    });
  });

  describe('publishMessage', () => {
    it('should log error if no device', () => {
      service['device'] = null;
      const errorSpy = jest.spyOn(service['logger'], 'error').mockImplementation();
      service.publishMessage('topic', { foo: 'bar' });
      expect(errorSpy).toHaveBeenCalledWith('❌ MQTT Device is not initialized.');
    });

    it('should publish a message', () => {
      service['device'] = mockDevice;
      service.publishMessage('topic', { foo: 'bar' });
      expect(mockDevice.publish).toHaveBeenCalledWith(
        'topic',
        JSON.stringify({ foo: 'bar' }),
        expect.any(Function)
      );
    });
  });

  describe('validateAndCallMfHandler', () => {
    it('should call processMessage on cwdMqttService', () => {
      service.validateAndCallMfHandler('topic', 'payload');
      expect(mockListener.processMessage).toHaveBeenCalledWith('topic', 'payload');
    });
  });
});
