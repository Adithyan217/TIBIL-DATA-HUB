import { Test, TestingModule } from '@nestjs/testing';
import { sbController } from './sb.controller';

describe('sbController', () => {
  let controller: sbController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [sbController],
    }).compile();

    controller = module.get<sbController>(sbController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
