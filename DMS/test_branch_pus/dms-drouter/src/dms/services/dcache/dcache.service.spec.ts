import { Test, TestingModule } from '@nestjs/testing';
import { DcacheService } from './dcache.service';

describe('DcacheService', () => {
  let service: DcacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DcacheService],
    }).compile();

    service = module.get<DcacheService>(DcacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
