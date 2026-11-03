import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Worker } from 'worker_threads';
import * as path from 'path';

@Injectable()
export class WorkerService implements OnModuleDestroy {
  private readonly workerPaths = {
    encrypter: path.resolve(__dirname, '../../workers/encrypterWorker.js'),
    decrypter: path.resolve(__dirname, '../../workers/decrypterWorker.js'),
    transformer: path.resolve(__dirname, '../../workers/transformerWorker.js'),
  };

  private workers: Record<string, Worker> = {};

  constructor() {
    // Initialize workers
    Object.entries(this.workerPaths).forEach(([type, workerPath]) => {
      this.workers[type] = new Worker(workerPath);
    });
  }

  /**
   * Run a task on the specified worker
   * @param worker Worker instance
   * @param data Task data
   * @returns Promise<any>
   */
  runWorkerTask(worker: Worker, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const messageListener = (result: any) => {
        this.cleanupWorkerListeners(worker); // Cleanup listeners
        resolve(result);
      };

      const errorListener = (err: any) => {
        this.cleanupWorkerListeners(worker); // Cleanup listeners
        reject(err);
      };

      const exitListener = (code: number) => {
        this.cleanupWorkerListeners(worker); // Cleanup listeners
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      };

      worker.once('message', messageListener);
      worker.once('error', errorListener);
      worker.once('exit', exitListener);

      worker.postMessage(data);
    });
  }

  /**
   * Get the specified worker
   * @param type Worker type
   * @returns Worker instance
   */
  getWorker(type: 'encrypter' | 'decrypter' | 'transformer'): Worker {
    return this.workers[type];
  }

  /**
   * Cleanup listeners attached to a worker
   * @param worker Worker instance
   */
  private cleanupWorkerListeners(worker: Worker): void {
    worker.removeAllListeners('message');
    worker.removeAllListeners('error');
    worker.removeAllListeners('exit');
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy() {
    Object.values(this.workers).forEach(worker => worker.terminate());
  }
}
