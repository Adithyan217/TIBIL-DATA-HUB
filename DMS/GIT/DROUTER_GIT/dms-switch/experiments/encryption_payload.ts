import * as crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const secretKey = Buffer.from('secret_key', 'utf8'); 
const initVector = Buffer.from('init_vector', 'utf8'); 
interface RequestBody {
  reqRefNo: string;
  rrn: string;
  txnAmt: string;
  txnTimestamp: string;
  timeStamp: number;
  deviceId: number;
}

function encrypt(data: RequestBody): string {
  const dataBuffer = Buffer.from(JSON.stringify(data), 'utf8');

  const cipher = crypto.createCipheriv(algorithm, secretKey, initVector);

  let encrypted = cipher.update(dataBuffer);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag();

  const encryptedDataWithTag = Buffer.concat([encrypted, authTag]);

  const encryptedBase64 = encryptedDataWithTag.toString('base64');

  return encryptedBase64;
}

const requestBody: RequestBody = {
  reqRefNo: "ae81ca6b-e527-4201-aaae-1c861a517f06",
  rrn: "421312",
  txnAmt: "12",
  txnTimestamp: "1700741921",
  timeStamp: 1705643830,
  deviceId: 100086,
};

const encryptedData = encrypt(requestBody);

console.log('Encrypted data (Base64):', encryptedData);
