import * as crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const secretKey = Buffer.from('k92ldahavl97s428vxri7x89seoy79sm', 'utf8');
const initVector = Buffer.from('7dzhcnrb0016hmj3', 'utf8');

function decrypt(encryptedbase64Text: string): string {
  try {
    const encryptedData = Buffer.from(encryptedbase64Text, 'base64');
    const authTag = encryptedData.slice(encryptedData.length - 16);
    const encryptedText = encryptedData.slice(0, encryptedData.length - 16);

    const decipher = crypto.createDecipheriv(algorithm, secretKey, initVector);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('Decryption failed:', err);
    throw err;
  }
}

const encryptedData = 'VSpCIOGSI3DX/16Os0QOaYdTBA4oZ9Sut+KELT4V1B/Xr60DQ3pnFnE81JKND0x8z5iLUoOyNzllRjNTijdTSclYiTtBVnjgkxDd8poWhGrjMzeIk8G0MUtwrQSu683Fpm+lNHjSODAKBuw7tek8eJZ03YU=';

try {
  const decryptedData = decrypt(encryptedData);
  console.log('Decrypted data:', decryptedData);
} catch (err) {
  console.error('Error during decryption:', (err as Error).message);
}
