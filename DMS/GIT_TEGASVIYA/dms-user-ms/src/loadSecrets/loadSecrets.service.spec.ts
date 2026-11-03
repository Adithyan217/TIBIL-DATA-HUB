import { Test, TestingModule } from '@nestjs/testing';
import { LoadSecretsService } from './loadSecrets.service';
import { ConfigService } from '@nestjs/config';
import { WinstonLoggerService } from '../user/services/winstonlogger/winstonlogger.service';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

describe('LoadSecretsService', () => {
  let service: LoadSecretsService;
  const originalEnv = process.env;

  const mockSecrets = {
    DB_USER: 'test_user',
    DB_PASS: 'securepass',
  };

  const mockLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetModules(); // Reset between tests
    process.env = { ...originalEnv, ENVIRONMENT: 'test' };

    (fs.existsSync as jest.Mock).mockImplementation((filePath) =>
                                                        filePath.includes('test-user-ms') || filePath.includes('test-common-secrets')
    );

    (fs.readFileSync as jest.Mock).mockImplementation((filePath) => {
      if (filePath.includes('test-user-ms')) {
        return JSON.stringify({ DB_USER: 'test_user' });
      }
      if (filePath.includes('test-common-secrets')) {
        return JSON.stringify({ DB_PASS: 'securepass' });
      }
      return '';
    });

    const module: TestingModule = await Test.createTestingModule({
                                                                   providers: [
                                                                     LoadSecretsService,
                                                                     { provide: ConfigService, useValue: {} },
                                                                     { provide: WinstonLoggerService, useValue: mockLogger },
                                                                   ],
                                                                 }).compile();

    service = module.get<LoadSecretsService>(LoadSecretsService);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should load secrets and assign them to process.env', () => {
    expect(service.secrets).toEqual(mockSecrets);
    expect(process.env.DB_USER).toBe('test_user');
    expect(process.env.DB_PASS).toBe('securepass');
  });

  it('should handle missing secret files gracefully and log warning', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const module: TestingModule = await Test.createTestingModule({
                                                                   providers: [
                                                                     LoadSecretsService,
                                                                     { provide: ConfigService, useValue: {} },
                                                                     { provide: WinstonLoggerService, useValue: mockLogger },
                                                                   ],
                                                                 }).compile();

    const instance = module.get<LoadSecretsService>(LoadSecretsService);

    expect(instance.secrets).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('should log error and throw if JSON parse fails', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('{ invalid_json }');

    expect(() => {
      new LoadSecretsService({} as ConfigService, mockLogger as any);
    }).toThrow('Failed to load secrets');

    expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to load secrets:'),
    );
  });
});
