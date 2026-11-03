import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { writeFileSync, existsSync, appendFileSync } from 'fs';
import * as path from 'path';

import * as dotenv from 'dotenv';
import {WinstonLoggerService} from "../common/service/winstonlogger/winstonlogger.service";
@Injectable()
export class LoadSecretsService {
    private readonly envFiles = [
        `src/secrets/${process.env.ENVIRONMENT}-drouter-ms` ,
        `src/secrets/${process.env.ENVIRONMENT}-common-secrets`,
        `src/secrets/${process.env.ENVIRONMENT}-registry-ms`,

    ];


    public secrets = {};
    public envSecrets = {};

    constructor(private readonly configService: ConfigService, protected wl: WinstonLoggerService) {
        this.envSecrets = this.formatSecrets(this.envFiles);
        Object.entries(this.envSecrets).forEach(([key, value]) => {
            process.env[key] = String(value);  // ✅ Directly set in process.env
        });
    }


    private formatSecrets(files: string[]) {
        const secrets = {};

        files.forEach( (file) => {
            const fullPath = path.join( process.cwd() , file );
            if (!existsSync( fullPath )) {
                this.wl.warn( `⚠️ Secret file not found: ${fullPath}` );
                return;
            }

            const rawContent = readFileSync( fullPath , 'utf8' ).trim();
            const parsedSecrets = JSON.parse( rawContent );
            Object.assign( secrets , parsedSecrets ); // ✅ Merge loadSecrets
        } );
        return secrets;
    }
    public getSecrets(): Record<string, string> {
        return this.envSecrets;
    }
}