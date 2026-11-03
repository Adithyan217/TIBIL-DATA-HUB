const crypto = require('crypto');
const SECRET_KEY = Buffer.from('k92ldahavl97s428vxri7x89seoy79sm', 'utf-8');
const INIT_VECTOR = Buffer.from('7dzhcnrb0016hmj3', 'utf-8');

const encryptData = (data) => {
  const dataBuffer = Buffer.from(data, 'utf8');
  const cipher = crypto.createCipheriv('aes-256-gcm',SECRET_KEY, INIT_VECTOR);
  let encrypted = cipher.update(dataBuffer);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  const encryptedDataWithTag = Buffer.concat([encrypted, authTag]);
  const encryptedBase64 = encryptedDataWithTag.toString('base64');
  return {encryptedData: encryptedBase64};
};

const decryptData = (data) => {
    const encryptedData = Buffer.from(data, 'base64');
    const authTag = encryptedData.slice(encryptedData.length - 16);
    const encryptedText = encryptedData.slice(0, encryptedData.length - 16);

    const decipher = crypto.createDecipheriv('aes-256-gcm', SECRET_KEY, INIT_VECTOR);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return {decryptedData: decrypted.toString('utf8')};
};

module.exports = { encryptData, decryptData };


