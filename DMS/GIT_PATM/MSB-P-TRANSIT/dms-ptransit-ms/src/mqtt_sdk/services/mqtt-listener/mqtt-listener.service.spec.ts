import { Test, TestingModule } from '@nestjs/testing';
import { CwdMqttService } from './mqtt-listener.service';

describe('CwdMqttService', () => {
  let service: CwdMqttService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CwdMqttService],
    }).compile();

    service = module.get<CwdMqttService>(CwdMqttService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
