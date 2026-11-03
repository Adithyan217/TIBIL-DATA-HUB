import { Test, TestingModule } from '@nestjs/testing';
import { PnotifController } from './pnotif.controller';

describe('PnotifController', () => {
  let controller: PnotifController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PnotifController],
    }).compile();

    controller = module.get<PnotifController>(PnotifController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
