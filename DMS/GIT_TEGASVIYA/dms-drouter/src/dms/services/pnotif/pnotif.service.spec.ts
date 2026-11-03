import { Test, TestingModule } from '@nestjs/testing';
import { PnotifService } from './pnotif.service';

describe('PnotifService', () => {
  let service: PnotifService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PnotifService],
    }).compile();

    service = module.get<PnotifService>(PnotifService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
