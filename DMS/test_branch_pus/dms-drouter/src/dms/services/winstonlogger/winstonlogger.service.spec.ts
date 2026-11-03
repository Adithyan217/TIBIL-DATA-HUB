import { Test, TestingModule } from '@nestjs/testing';
import { WinstonloggerService } from './winstonlogger.service';

describe('WinstonloggerService', () => {
  let service: WinstonloggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WinstonloggerService],
    }).compile();

    service = module.get<WinstonloggerService>(WinstonloggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
