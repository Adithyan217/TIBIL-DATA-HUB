import { Test, TestingModule } from '@nestjs/testing';
import { LoadSecretsService } from './load-secrets.service';

describe('LoadSecretsService', () => {
  let service: LoadSecretsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoadSecretsService],
    }).compile();

    service = module.get<LoadSecretsService>(LoadSecretsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
