const { parentPort } = require('worker_threads');
const transformer = require('../utils/transformer');

parentPort.on('message', async (content) => {
    try {
        const transformedData = await transformer[content?.context](content.data, content.config);
        parentPort.postMessage({ success: true, transformed: transformedData });
    } catch (error) {
        console.error("Error occured during transformation", error)
        parentPort.postMessage({ success: false, error: error.message });
    }
});
