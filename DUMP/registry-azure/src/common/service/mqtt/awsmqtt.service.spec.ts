import { Test, TestingModule } from '@nestjs/testing';
import { AwsmqttService } from './awsmqtt.service';

describe('MqttService', () => {
  let service: AwsmqttService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AwsmqttService],
    }).compile();

    service = module.get<AwsmqttService>( AwsmqttService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
