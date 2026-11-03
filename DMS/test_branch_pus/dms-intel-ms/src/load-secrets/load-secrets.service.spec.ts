import { Test, TestingModule } from '@nestjs/testing';
import { LoadSecretsService } from './load-secrets.service';
import { ConfigService } from '@nestjs/config';
import { WinstonLoggerService } from '../common/winstonlogger/winstonlogger.service';
import * as path from 'path';
import * as fs from 'fs';

// Mock WinstonLoggerService
class MockLogger {
  error = jest.fn();
  warn = jest.fn();
  log = jest.fn();
}

// Mock fs
jest.mock('fs');

describe('LoadSecretsService', () => {
  let service: LoadSecretsService;

  const mockLogger = new MockLogger();
  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'ENVIRONMENT') return 'dev'; // Matches expected filenames
      return '';
    }),
  };

  const secretData1 = JSON.stringify({ KEY_ONE: 'value1' });
  const secretData2 = JSON.stringify({ KEY_TWO: 'value2' });

  beforeEach(async () => {
    jest.resetAllMocks();

    const basePath = process.cwd();

    // Mock existsSync to return true only for the known paths
    (fs.existsSync as jest.Mock).mockImplementation((filePath) => {
      return (
          filePath === path.join(basePath, 'src/secrets/uat-common-secrets') ||
          filePath === path.join(basePath, 'src/secrets/dev-intel-ms')
      );
    });

    // Mock readFileSync based on full resolved path
    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath === path.join(basePath, 'src/secrets/uat-common-secrets')) {
        return secretData2;
      }
      if (filePath === path.join(basePath, 'src/secrets/dev-intel-ms')) {
        return secretData1;
      }
      return '';
    });

    const module: TestingModule = await Test.createTestingModule({
                                                                   providers: [
                                                                     LoadSecretsService,
                                                                     { provide: ConfigService, useValue: mockConfigService },
                                                                     { provide: WinstonLoggerService, useValue: mockLogger },
                                                                   ],
                                                                 }).compile();

    service = module.get<LoadSecretsService>(LoadSecretsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });


  it('should return empty object if file is missing', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    const result = service['formatSecrets'](['invalid-file']);
    expect(result).toEqual({});
  });


});
