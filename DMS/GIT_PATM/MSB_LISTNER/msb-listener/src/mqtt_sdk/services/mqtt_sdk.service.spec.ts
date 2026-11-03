import { Test, TestingModule } from '@nestjs/testing';
import { MqttSdkService } from './mqtt_sdk.service';
import { CwdMqttService } from './cwd-mqtt/mqtt-listener.service';
import { LoadSecretsService } from '../../load-secret/load-secret.service';
import * as awsIot from 'aws-iot-device-sdk';
import * as fs from 'fs';

// Mocks
jest.mock('aws-iot-device-sdk', () => ({
  device: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    subscribe: jest.fn((topic, cb) => cb(null, [{ topic }])),
    publish: jest.fn((topic, msg, cb) => cb(null)),
    end: jest.fn((_, cb) => cb && cb()),
  })),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe('MqttSdkService', () => {
  let service: MqttSdkService;
  let cwdMqttService: CwdMqttService;

  const mockMqttService = {
    processMessage: jest.fn(),
  };

  const mockSecretsService = {
    metricConfig: {
      listener_config: {
        topics: ['topic/1', 'topic/2'],
      },
    },
  };

  const envBackup = { ...process.env };

  beforeEach(async () => {
    process.env.MQTT_PRIVATE_KEY = Buffer.from('dummy-key').toString('base64');
    process.env.MQTT_CERT_KEY = Buffer.from('dummy-cert').toString('base64');
    process.env.MQTT_CA_KEY = Buffer.from('dummy-ca').toString('base64');
    process.env.MQTT_HOST = 'iot.example.com';

    const module: TestingModule = await Test.createTestingModule({
                                                                   providers: [
                                                                     MqttSdkService,
                                                                     { provide: CwdMqttService, useValue: mockMqttService },
                                                                     { provide: LoadSecretsService, useValue: mockSecretsService },
                                                                   ],
                                                                 }).compile();

    service = module.get<MqttSdkService>(MqttSdkService);
    cwdMqttService = module.get<CwdMqttService>(CwdMqttService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = { ...envBackup };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize MQTT and subscribe to topics', () => {
    const spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    expect((awsIot.device as jest.Mock).mock.calls.length).toBe(1);
    expect(service['topics']).toEqual(['topic/1', 'topic/2']);
    spyLog.mockRestore();
  });

  it('should handle publishMessage without errors', () => {
    const topic = 'test/topic';
    const msg = { test: true };
    service.publishMessage(topic, msg);
    expect((service as any).device.publish).toHaveBeenCalledWith(
        topic,
        JSON.stringify(msg),
        expect.any(Function),
    );
  });

  it('should handle destroyConnection', () => {
    const spy = jest.spyOn((service as any).device, 'end');
    (service as any).destroyConnection();
    expect(spy).toHaveBeenCalled();
  });

  it('should call processMessage on incoming message', () => {
    service.validateAndCallMfHandler('topic/test', 'payload');
    expect(cwdMqttService.processMessage).toHaveBeenCalledWith('topic/test', 'payload');
  });

  it('should throw error if secrets are missing', () => {
    delete process.env.MQTT_CA_KEY;
    expect(() => new MqttSdkService(mockMqttService as any, mockSecretsService as any)).toThrow();
  });
});
