import { Test, TestingModule } from "@nestjs/testing";
import { WfalogService } from "./wfalog.service";

describe("WfalogService", () => {
  let service: WfalogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WfalogService],
    }).compile();

    service = module.get<WfalogService>(WfalogService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
