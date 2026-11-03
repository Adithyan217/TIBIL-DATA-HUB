import { Test, TestingModule } from '@nestjs/testing';
import { RoutesQueryService } from './routes-query.service';

describe('RoutesQueryService', () => {
  let service: RoutesQueryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoutesQueryService],
    }).compile();

    service = module.get<RoutesQueryService>(RoutesQueryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
