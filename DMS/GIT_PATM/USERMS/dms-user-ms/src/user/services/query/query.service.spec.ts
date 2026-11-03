import { Test, TestingModule } from "@nestjs/testing";
import { queryService } from "./query.service";

describe("QueryService", () => {
  let service: queryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [queryService],
    }).compile();

    service = module.get<queryService>(queryService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
