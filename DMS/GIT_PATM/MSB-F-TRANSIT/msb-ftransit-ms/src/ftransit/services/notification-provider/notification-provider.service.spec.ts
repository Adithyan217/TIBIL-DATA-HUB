import { Test, TestingModule } from '@nestjs/testing';
import { NotificationProviderService } from './notification-provider.service';

describe('NotificationProviderService', () => {
  let service: NotificationProviderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationProviderService],
    }).compile();

    service = module.get<NotificationProviderService>(NotificationProviderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
