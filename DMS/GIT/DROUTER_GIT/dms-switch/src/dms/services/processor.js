

const {runWorkerTask, workers} = require("../utils/thread");


const executeProcessAndReturnResult = async (req)=> {
    const { data, contextKey } = req;

    try {
        const decryptResult = await runWorkerTask(workers.decrypter, {
            encryptedData: data.encryptedData,
            authTag: data.authTag,
        });
        const transformedData = await runWorkerTask(workers.transformer, {
            content: decryptResult.decryptedData,
            context: contextKey
        });
        const encryptResult = await runWorkerTask(workers.encrypter, transformedData.transformedData);

        return {
            decrypted_data: decryptResult,
            transformed_data: transformedData,
            encrypted_data: encryptResult
        };
    } catch (e) {
        console.error('process error', e.message);
        return{ error: 'An error occurred while processing the request.' };
    }
};


module.exports = {executeProcessAndReturnResult};