import { Test, TestingModule } from '@nestjs/testing';
import { MsbUserService } from './msb-user.service';

describe('MsbUserService', () => {
  let service: MsbUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MsbUserService],
    }).compile();

    service = module.get<MsbUserService>(MsbUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
