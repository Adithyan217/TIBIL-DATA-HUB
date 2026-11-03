import { Test, TestingModule } from '@nestjs/testing';
import { MqttSdkController } from './mqtt_sdk.controller';

describe('MqttSdkController', () => {
  let controller: MqttSdkController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MqttSdkController],
    }).compile();

    controller = module.get<MqttSdkController>(MqttSdkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

