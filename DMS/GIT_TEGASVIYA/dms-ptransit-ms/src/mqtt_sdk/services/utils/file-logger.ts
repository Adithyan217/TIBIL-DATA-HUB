// src/common/logger/file-logger.ts
import * as fs from 'fs';
import * as path from 'path';

export class FileLogger {
    private static logFilePath = path.resolve(__dirname, '../../../../pcwdlogs/response-log.txt');

    static log(message: string) {
        const logLine = `[${new Date().toISOString()}] ${message}\n`;
        fs.appendFileSync(this.logFilePath, logLine, { encoding: 'utf8' });
    }
}
