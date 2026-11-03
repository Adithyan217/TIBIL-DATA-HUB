import { Test, TestingModule } from '@nestjs/testing';
import { PbacklogsService } from './pbacklogs.service';

describe('PbacklogsService', () => {
  let service: PbacklogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PbacklogsService],
    }).compile();

    service = module.get<PbacklogsService>(PbacklogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
