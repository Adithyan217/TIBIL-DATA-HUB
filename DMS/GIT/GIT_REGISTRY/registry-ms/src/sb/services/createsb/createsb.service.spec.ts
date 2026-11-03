import { Test, TestingModule } from '@nestjs/testing';
import { createSbService } from './createsb.service';

describe('createSbService', () => {
  let service: createSbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [createSbService],
    }).compile();

    service = module.get<createSbService>(createSbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
