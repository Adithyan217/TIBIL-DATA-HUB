const { parentPort } = require('worker_threads');
const { transform } = require('../utils/transformer');

parentPort.on('message', async (data) => {
    try {
        const transformedData = await transform(data.content, data.context);
        parentPort.postMessage({ success: true, transformedData });
    } catch (error) {
        parentPort.postMessage({ success: false, error: error.message });
    }
});
