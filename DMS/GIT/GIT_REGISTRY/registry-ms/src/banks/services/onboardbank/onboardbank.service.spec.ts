import { Test, TestingModule } from '@nestjs/testing';
import { onboardBankService } from './onboardbank.service';

describe('onboardBankService', () => {
  let service: onboardBankService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [onboardBankService],
    }).compile();

    service = module.get<onboardBankService>(onboardBankService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
