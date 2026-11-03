import { Test, TestingModule } from "@nestjs/testing";
import { WfhlogService } from "./wfhlog.service";

describe("WfhlogService", () => {
  let service: WfhlogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WfhlogService],
    }).compile();

    service = module.get<WfhlogService>(WfhlogService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
