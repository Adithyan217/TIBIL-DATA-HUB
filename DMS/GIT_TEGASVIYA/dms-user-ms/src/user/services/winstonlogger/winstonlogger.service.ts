import { LoggerService, Injectable } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class WinstonLoggerService implements LoggerService {
    private logger: winston.Logger;

    constructor() {
        this.logger = winston.createLogger({
                                               level: 'info',
                                               format: winston.format.combine(
                                                   winston.format.timestamp(),
                                                   winston.format.json() // JSON format for file logs
                                               ),
                                               transports: [
                                                   new winston.transports.Console({
                                                                                      format: winston.format.combine(
                                                                                          winston.format.colorize(), // Enable color coding
                                                                                          winston.format.printf(({ level, message, timestamp }) => {
                                                                                              return `${timestamp} [${level}]: ${message}`;
                                                                                          })
                                                                                      ),
                                                                                  }),
                                                   new winston.transports.File({
                                                                                   filename: 'logs/error.log',
                                                                                   level: 'error',
                                                                                   format: winston.format.combine(
                                                                                       winston.format.timestamp(),
                                                                                       winston.format.json()
                                                                                   ),
                                                                               }),
                                               ],
                                           });
    }

    log(message: string) {
        this.logger.info(message);
    }

    error(message: string, trace?: string) {
        this.logger.error(`${message} - ${trace || 'No stack trace'}`);
    }

    warn(message: string) {
        this.logger.warn(message);
    }

    debug?(message: string) {
        this.logger.debug(message);
    }

    verbose?(message: string) {
        this.logger.verbose(message);
    }
}
