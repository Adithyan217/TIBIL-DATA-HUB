import { Test, TestingModule } from '@nestjs/testing';
import { OtpProviderService } from './otp-provider.service';

describe('OtpProviderService', () => {
  let service: OtpProviderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OtpProviderService],
    }).compile();

    service = module.get<OtpProviderService>(OtpProviderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
