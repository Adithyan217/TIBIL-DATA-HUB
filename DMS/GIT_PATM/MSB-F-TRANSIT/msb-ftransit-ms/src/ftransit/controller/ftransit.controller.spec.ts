import { Test, TestingModule } from '@nestjs/testing';
import { FtransitController } from './ftransit.controller';

describe('FtransitController', () => {
  let controller: FtransitController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FtransitController],
    }).compile();

    controller = module.get<FtransitController>(FtransitController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
