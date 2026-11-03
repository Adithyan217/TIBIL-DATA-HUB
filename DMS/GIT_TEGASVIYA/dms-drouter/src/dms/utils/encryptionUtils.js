const crypto = require('crypto');
const symEncryptor = (data, config) => {
  const { algo, key, iv } = config;
  const dataBuffer = Buffer.from(data, 'utf8');
  const cipher = crypto.createCipheriv(algo, key, iv);
  let encrypted = cipher.update(dataBuffer);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  const encryptedDataWithTag = Buffer.concat([encrypted, authTag]);
  const encryptedBase64 = encryptedDataWithTag.toString('base64');
  return encryptedBase64;
};



module.exports = { symEncryptor };
