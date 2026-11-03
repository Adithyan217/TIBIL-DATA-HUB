const { parentPort } = require('worker_threads');
const { decryptData } = require('../utils/encryptionUtils');

parentPort.on('message', (data) => {
    try {
        const decryptedData = decryptData(data.encryptedData);
        parentPort.postMessage({ success: true, decryptedData });
    } catch (error) {
        parentPort.postMessage({ success: false, error: error.message });
    }
});
