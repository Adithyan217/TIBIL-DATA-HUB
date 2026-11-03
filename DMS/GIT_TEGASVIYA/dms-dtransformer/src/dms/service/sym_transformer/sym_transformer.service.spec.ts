import { Test, TestingModule } from '@nestjs/testing';
import { Sym_transformerService } from './sym_transformer.service';
import { symEncryptor } from '../../utils/encryptionUtils';
import { symDecryptor } from '../../utils/decryptionUtils';
import { transform, replacePlaceholder } from '../../utils/transformer';

// Mocking the dependencies with types
jest.mock('../../utils/encryptionUtils', () => ({
  symEncryptor: jest.fn(),
}));

jest.mock('../../utils/decryptionUtils', () => ({
  symDecryptor: jest.fn(),
}));

jest.mock('../../utils/transformer', () => ({
  transform: jest.fn(),
  replacePlaceholder: jest.fn(),
}));

describe('Sym_transformerService', () => {
  let service: Sym_transformerService;

  const mockDecryptedData = {
    code: 200,
    data: {
      txnAmt: 100,
      cache_pid: '123',
    },
    message: '',
  };

  const mockTransformedData = {
    data: { txnAmt: '10000' },
  };

  const mockEncryptedData = {
    data: 'encryptedData',
  };

  const mockTopicData = {
    data: 'topicUrl',
  };

  const config = {
    security: 'securityKey',
    sTransform_config: {},
    dTransform_config: { moneyFormat: 'paisa' },
    topic: {
      url: 'topicUrl',
      replacer: 'replacerData',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
                                                                   providers: [Sym_transformerService],
                                                                 }).compile();

    service = module.get<Sym_transformerService>(Sym_transformerService);
    jest.clearAllMocks(); // Clear mocks to ensure clean slate for each test
  });

  it('should call the correct methods in transformation pipeline', async () => {
    const body = { data: { payload: 'payloadData', cache_pid: '123', did: 'did' } };

    (symDecryptor as jest.Mock).mockResolvedValue(mockDecryptedData);
    (transform as jest.Mock).mockResolvedValue(mockTransformedData);
    (symEncryptor as jest.Mock).mockResolvedValue(mockEncryptedData);
    (replacePlaceholder as jest.Mock).mockResolvedValue(mockTopicData);

    await service.transformations(body, config);

    // Verify if all dependencies are called correctly in the right order
    expect(symDecryptor).toHaveBeenCalledWith(body.data.payload, config.security);
    expect(transform).toHaveBeenCalledTimes(2); // Should be called twice for sTransformation and dTransformation
    expect(symEncryptor).toHaveBeenCalledWith(JSON.stringify(mockTransformedData.data), config.security);
    expect(replacePlaceholder).toHaveBeenCalledWith(config.topic.url, config.topic.replacer, body.data.did);
  });

  it('should handle decryption failure', async () => {
    const errorDecryption = { code: 400, message: 'Decryption error' };
    (symDecryptor as jest.Mock).mockResolvedValue(errorDecryption);

    const body = { data: { payload: 'payloadData', cache_pid: '123', did: 'did' } };

    const result = await service.transformations(body, config);

    expect(result.code).toBe(400);
    expect(result.message).toBe(errorDecryption.message);
  });

  it('should handle transformation errors', async () => {
    (symDecryptor as jest.Mock).mockResolvedValue(mockDecryptedData);
    (transform as jest.Mock).mockRejectedValue(new Error('Transformation error'));

    const body = { data: { payload: 'payloadData', cache_pid: '123', did: 'did' } };

    const result = await service.transformations(body, config);

    expect(result.code).toBe(400);
    expect(result.message).toBe('Transformation error');
  });

  it('should handle errors during encryption', async () => {
    (symDecryptor as jest.Mock).mockResolvedValue(mockDecryptedData);
    (transform as jest.Mock).mockResolvedValue(mockTransformedData);
    (symEncryptor as jest.Mock).mockRejectedValue(new Error('Encryption error'));

    const body = { data: { payload: 'payloadData', cache_pid: '123', did: 'did' } };

    const result = await service.transformations(body, config);
    expect(result.code).toBe(400);
    expect(result.message).toBe('Encryption error');
  });

  it('should convert txnAmt to paisa when moneyFormat is paisa', async () => {
    (symDecryptor as jest.Mock).mockResolvedValue(mockDecryptedData);
    (transform as jest.Mock).mockResolvedValue(mockTransformedData);
    (symEncryptor as jest.Mock).mockResolvedValue(mockEncryptedData);
    (replacePlaceholder as jest.Mock).mockResolvedValue(mockTopicData);

    const modifiedConfig = { ...config, dTransform_config: { moneyFormat: 'paisa' } };
    const body = { data: { payload: 'payloadData', cache_pid: '123', did: 'did' } };

    const result = await service.transformations(body, modifiedConfig);

    // Expected value after multiplying 100000 by 100 = 10000
    expect(result.data.decrypted_request.txnAmt).toBe('10000000000');
  });

  // Additional test cases

  it('should handle missing config values gracefully', async () => {
    const incompleteConfig = { security: 'securityKey' }; // Missing other config values
    (symDecryptor as jest.Mock).mockResolvedValue(mockDecryptedData);

    const body = { data: { payload: 'payloadData', cache_pid: '123', did: 'did' } };

    const result = await service.transformations(body, incompleteConfig);

    expect(result.code).toBe(400);
    expect(result.message).toBe('Missing necessary configuration parameters');
  });

  it('should handle invalid payload format gracefully', async () => {
    const invalidPayload = { data: null }; // Invalid payload data
    (symDecryptor as jest.Mock).mockResolvedValue(mockDecryptedData);

    const result = await service.transformations(invalidPayload, config);

    expect(result.code).toBe(400);
    expect(result.message).toBe('Invalid payload data');
  });
});
