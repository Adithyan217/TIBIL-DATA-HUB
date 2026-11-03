const crypto = require('crypto')

interface EncryptConfig {
  algo: string;
  key: Buffer;
  iv: Buffer;
}

interface EncryptSuccess {
  code: 200;
  data: string;
}

interface EncryptError {
  code: 400;
  message: string;
}

type EncryptResult = EncryptSuccess | EncryptError;

const symEncryptor = (data: string, config: EncryptConfig): EncryptResult => {
  try {
    const {algo, key, iv} = config;
    const dataBuffer = Buffer.from(data, 'utf8');
    const cipher = crypto.createCipheriv(algo, key, iv);
    let encrypted = cipher.update(dataBuffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();
    const encryptedDataWithTag = Buffer.concat([encrypted, authTag]);
    const encryptedBase64 = encryptedDataWithTag.toString('base64');
    return {code: 200, data: encryptedBase64}
  } catch (e: any) {
    return {
      code: 400,
      message: e.message,
    };
  }
};

export { symEncryptor, EncryptConfig, EncryptResult };
