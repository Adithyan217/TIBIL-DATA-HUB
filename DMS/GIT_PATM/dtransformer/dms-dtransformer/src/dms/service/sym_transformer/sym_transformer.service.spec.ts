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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should perform transformations successfully', async () => {
    // Mocking the resolved values for methods
    (symDecryptor as jest.Mock).mockResolvedValue(mockDecryptedData);
    (transform as jest.Mock).mockResolvedValue(mockTransformedData);
    (symEncryptor as jest.Mock).mockResolvedValue(mockEncryptedData);
    (replacePlaceholder as jest.Mock).mockResolvedValue(mockTopicData);

    const body = { data: { payload: 'payloadData', cache_pid: '123', did: 'did' } };

    const result = await service.transformations(body, config);

    expect(result.code).toBe(200);
    expect(result.data.decrypted_request).toEqual(mockDecryptedData.data);
    expect(result.data.encrypted_response.data).toBe(mockEncryptedData.data);
    expect(result.data.mqtt_request).toEqual(mockTransformedData.data);
    expect(result.data.mqtt_topic).toBe(mockTopicData.data);
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


});
