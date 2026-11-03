import { Test, TestingModule } from '@nestjs/testing';
import { MqttSdkService } from './mqtt_sdk.service';

describe('MqttSdkService', () => {
  let service: MqttSdkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MqttSdkService],
    }).compile();

    service = module.get<MqttSdkService>(MqttSdkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
