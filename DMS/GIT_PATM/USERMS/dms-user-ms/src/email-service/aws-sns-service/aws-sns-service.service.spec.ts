import { Test, TestingModule } from '@nestjs/testing';
import { AwsSnsServiceService } from './aws-sns-service.service';

describe('EmailServiceService', () => {
  let service: AwsSnsServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AwsSnsServiceService],
    }).compile();

    service = module.get<AwsSnsServiceService>( AwsSnsServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
