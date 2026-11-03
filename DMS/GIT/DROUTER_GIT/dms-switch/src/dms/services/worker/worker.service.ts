// worker.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Worker } from 'worker_threads';
import * as path from 'path';

Worker.setMaxListeners(4);
@Injectable()
export class WorkerService implements OnModuleDestroy {


    private workers = {
        encrypter: new Worker(path.resolve(__dirname, '../../workers/encrypterWorker.js')),
        decrypter: new Worker(path.resolve(__dirname, '../../workers/decrypterWorker.js')),
        transformer: new Worker(path.resolve(__dirname, '../../workers/transformerWorker.js')),
    };

    // Function to run a task on the specified worker
    /*runWorkerTask(worker: Worker, data: any): Promise<any> {
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
    }*/

    runWorkerTask = (worker: Worker, data) => {
        return new Promise((resolve, reject) => {


            worker.once('message', (result) => resolve(result));
            worker.once('error', reject);
            worker.once('exit', (code) => {
                if (code !== 0) {
                    reject(new Error(`Worker stopped with exit code ${code}`));
                }
            });

            worker.postMessage(data);
        });
    };

    getWorker(type: 'encrypter' | 'decrypter' | 'transformer') {
        return this.workers[type];
    }

    // Cleanup on module destroy
    onModuleDestroy() {
        Object.values(this.workers).forEach(worker => worker.terminate());
    }
}
