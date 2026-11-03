import { Test, TestingModule } from '@nestjs/testing';
import { RcacheService } from './rcache.service';

describe('RcacheService', () => {
  let service: RcacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RcacheService],
    }).compile();

    service = module.get<RcacheService>(RcacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
