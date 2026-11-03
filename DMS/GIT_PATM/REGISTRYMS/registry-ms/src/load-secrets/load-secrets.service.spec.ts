import { Test, TestingModule } from '@nestjs/testing';
import { LoadSecretsService } from './load-secrets.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import {WinstonLoggerService} from "../common/service/winstonlogger/winstonlogger.service";

jest.mock('fs');

describe('LoadSecretsService', () => {
  let service: LoadSecretsService;
  const mockConfigService = {
    get: jest.fn(),
  };

  const mockEnv = 'test';
  const fullPaths = [
    path.join(process.cwd(), `src/secrets/${mockEnv}-common-secrets`),
    path.join(process.cwd(), `src/secrets/${mockEnv}-registry-ms`)
  ];
  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
  };
  beforeAll(() => {
    process.env.ENVIRONMENT = mockEnv;
  });

  beforeEach(async () => {
    // ✅ Mock fs.existsSync to return true only for expected files
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) =>
                                                        fullPaths.includes(filePath)
    );

    // ✅ Mock fs.readFileSync to return correct JSON string for each file
    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath === fullPaths[0]) {
        return JSON.stringify({ DB_PASS: 'commonpass', SHARED_KEY: 'xyz' });
      }
      if (filePath === fullPaths[1]) {
        return JSON.stringify({ DB_USER: 'testuser', DB_PASS: 'overridepass' });
      }
      throw new Error(`Unexpected file: ${filePath}`);
    });

    const module: TestingModule = await Test.createTestingModule({
                                                                   providers: [
                                                                     LoadSecretsService,
                                                                     {
                                                                       provide: ConfigService,
                                                                       useValue: mockConfigService,
                                                                     },
                                                                     { provide: WinstonLoggerService, useValue: mockLogger },
                                                                   ],
                                                                 }).compile();

    service = module.get<LoadSecretsService>(LoadSecretsService);
  });

  it('should load and merge secrets from files and update process.env', () => {
    const secrets = service.getSecrets();

    expect(secrets).toEqual({
                              DB_PASS: 'overridepass', // override from registry-ms
                              SHARED_KEY: 'xyz',
                              DB_USER: 'testuser',
                            });

    expect(process.env.DB_PASS).toBe('overridepass');
    expect(process.env.SHARED_KEY).toBe('xyz');
    expect(process.env.DB_USER).toBe('testuser');
  });

  it('should return the same object from getSecrets()', () => {
    const result = service.getSecrets();
    expect(result).toEqual(service.envSecrets);
  });

});
