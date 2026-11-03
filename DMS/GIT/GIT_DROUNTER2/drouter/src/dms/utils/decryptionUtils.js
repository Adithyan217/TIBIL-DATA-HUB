const crypto = require('crypto');

// Decryption function for symmetric encryption
const symDecryptor = (data, config) => {
    const { algo, key, iv } = config;
    const encryptedData = Buffer.from(data, 'base64');
    const authTag = encryptedData.slice(encryptedData.length - 16);
    const encryptedText = encryptedData.slice(0, encryptedData.length - 16);
    const decipher = crypto.createDecipheriv(algo, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
};


module.exports = {
    symDecryptor
    
};
