import crypto from 'crypto';

// Decryption function for symmetric encryption
const symDecryptor = (data, config) => {
    try {
        const { algo, key, iv } = config;
        console.log('data :: ', data);
        console.log('key :: ', key);
        console.log('iv :: ', iv);

        const encryptedData = Buffer.from(data, 'base64');
        const authTag = encryptedData.slice(encryptedData.length - 16);
        const encryptedText = encryptedData.slice(0, encryptedData.length - 16);

        const decipher = crypto.createDecipheriv(algo, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return {
            code: 200,
            data: JSON.parse(decrypted.toString('utf8'))
        }
    }
    catch (e) {
        console.log('decrypt error', e);
        return {
            code: 400,
            message: e.message,
        }
    }
};
export { symDecryptor }