import { Test, TestingModule } from '@nestjs/testing';
import { LoadSecretsService } from './loadSecrets.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

// Mock ConfigService
jest.mock('@nestjs/config');

describe('LoadSecretsService', () => {
  let service: LoadSecretsService;
  let configService: ConfigService;

  beforeEach(async () => {
    // Mock the ENVIRONMENT variable for the test
    process.env.ENVIRONMENT = 'env'; // Set the environment variable to a valid value

    const module: TestingModule = await Test.createTestingModule({
                                                                   providers: [
                                                                     LoadSecretsService,
                                                                     {
                                                                       provide: ConfigService,
                                                                       useValue: {
                                                                         get: jest.fn(),
                                                                       },
                                                                     },
                                                                   ],
                                                                 }).compile();

    service = module.get<LoadSecretsService>(LoadSecretsService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.ENVIRONMENT; // Clean up the environment variable after each test
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSecrets', () => {
    it('should load secrets from the provided file paths', () => {
      const mockSecrets = {
        secret1: 'value1',
        secret2: 'value2',
      };

      const mockPath = path.join(process.cwd(), 'src/secrets/dev-common-secrets');
      const mockContent = JSON.stringify(mockSecrets);

      // Mock fs.readFileSync and fs.existsSync using jest.spyOn()
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(mockContent);

      const secrets = service.getSecrets([mockPath]);

      expect(secrets).toEqual(mockSecrets);
      expect(fs.existsSync).toHaveBeenCalledWith(mockPath);
      expect(fs.readFileSync).toHaveBeenCalledWith(mockPath, 'utf8');
    });

    it('should handle non-existent files gracefully', () => {
      const mockPath = path.join(process.cwd(), 'src/secrets/nonexistent-secrets');

      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const secrets = service.getSecrets([mockPath]);

      expect(secrets).toEqual({});
      expect(fs.existsSync).toHaveBeenCalledWith(mockPath);
    });

    it('should merge secrets from multiple files', () => {
      const mockSecrets1 = { secret1: 'value1' };
      const mockSecrets2 = { secret2: 'value2' };

      const mockPath1 = path.join(process.cwd(), 'src/secrets/dev-common-secrets');
      const mockPath2 = path.join(process.cwd(), 'src/secrets/dev-dsconfig');

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync')
          .mockReturnValueOnce(JSON.stringify(mockSecrets1))
          .mockReturnValueOnce(JSON.stringify(mockSecrets2));

      const secrets = service.getSecrets([mockPath1, mockPath2]);

      expect(secrets).toEqual({
                                secret1: 'value1',
                                secret2: 'value2',
                              });
      expect(fs.readFileSync).toHaveBeenCalledWith(mockPath1, 'utf8');
      expect(fs.readFileSync).toHaveBeenCalledWith(mockPath2, 'utf8');
    });
  });

  describe('Constructor', () => {
    it('should load environment secrets and set them in process.env', () => {
      const mockEnvSecrets = { SECRET_KEY: 'env_value' };
      const mockSecretFile = { ds_key: '{"key": "value"}' };

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync')
          .mockReturnValueOnce(JSON.stringify(mockEnvSecrets))
          .mockReturnValueOnce(JSON.stringify(mockSecretFile));

      // Call constructor
      new LoadSecretsService(configService);

      expect(process.env['SECRET_KEY']).toBe('env_value');
      expect(service.sbConfig).toEqual({ ds_key: { key: 'value' } });
    });
  });
});
