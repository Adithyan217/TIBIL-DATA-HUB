import { Test, TestingModule } from '@nestjs/testing';
import { MqttIotCoreService } from './mqtt_iot_core.service';

describe('MqttIotCoreService', () => {
  let service: MqttIotCoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MqttIotCoreService],
    }).compile();

    service = module.get<MqttIotCoreService>(MqttIotCoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
