const { Worker } = require('worker_threads');
const path = require('path');
Worker.setMaxListeners(4)
// Initialize and store each worker during the bootstrap
const workers = {
    encrypter: new Worker(path.resolve(__dirname, '../workers/encrypterWorker.js')),
    decrypter: new Worker(path.resolve(__dirname, '../workers/decrypterWorker.js')),
    // processor: new Worker(path.resolve(__dirname, 'workers/processorWorker.js')),
    transformer: new Worker(path.resolve(__dirname, '../workers/transformerWorker.js')),
};

// Function to run a task on the specific worker
const runWorkerTask = (worker, data) => {
    return new Promise((resolve, reject) => {
        worker.once('message', resolve);
        worker.once('error', (err) => {
            console.error("Worker encountered an error:", err);
            reject(err);
        });
        worker.once('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });
        worker.postMessage(data);
    });
};

module.exports = { workers, runWorkerTask };
