import { Test, TestingModule } from '@nestjs/testing';
import { BanksController } from './bank.controller';

describe('BankController', () => {
  let controller: BanksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BanksController],
    }).compile();

    controller = module.get<BanksController>(BanksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
