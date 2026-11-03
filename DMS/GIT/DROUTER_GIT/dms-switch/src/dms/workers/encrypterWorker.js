const { parentPort } = require('worker_threads');
const { encryptData } = require('../utils/encryptionUtils');

parentPort.on('message', (data) => {
    try {
        const encryptedData = encryptData(data);
        parentPort.postMessage({ success: true, encryptedData });
    } catch (error) {
        parentPort.postMessage({ success: false, error: error.message });
    }
});
