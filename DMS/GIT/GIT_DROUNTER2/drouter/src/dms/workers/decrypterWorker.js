const { parentPort } = require('worker_threads');
const decryptionFunctions = require('../utils/decryptionUtils'); // Import decryption functions

parentPort.on('message', async (content) => {
    try {
        console.log("The decryption is::::",content?.config?.dtype)
        const decryptionFunction = decryptionFunctions[content?.config?.dtype];
        const decryptedData = decryptionFunction(content.data, content.config);
        parentPort.postMessage({ success: true, decrypted: decryptedData });
    } catch (error) {
        console.error("Error during decryption:", error.stack || error);
        parentPort.postMessage({ success: false, error: error.message });
    }
});
