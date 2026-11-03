const { parentPort } = require('worker_threads');
const encryptFunctions = require('../utils/encryptionUtils');

parentPort.on('message', async (content) => {
    try {
        console.log("The encryption is::::",content?.config?.etype)
        const encryptFunction = encryptFunctions[content?.config?.etype];
        const encryptedData = encryptFunction(content.data, content.config);
        parentPort.postMessage({ success: true, encrypted: encryptedData });
    } catch (error) {
        console.error("Error during encryption:", error.stack || error);
        parentPort.postMessage({ success: false, error: error.message });
    }
});