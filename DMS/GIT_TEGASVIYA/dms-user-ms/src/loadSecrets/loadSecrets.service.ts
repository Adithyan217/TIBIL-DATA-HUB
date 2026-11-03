import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { writeFileSync, existsSync, appendFileSync } from 'fs';
import * as path from 'path';

import * as dotenv from 'dotenv';
import {WinstonLoggerService} from "../user/services/winstonlogger/winstonlogger.service";
@Injectable()
export class LoadSecretsService {
    private readonly secretFiles = [
        `src/secrets/${process.env.ENVIRONMENT}-user-ms` ,
        `src/secrets/${process.env.ENVIRONMENT}-common-secrets`
    ];
    public secrets = {};
    constructor(private readonly configService: ConfigService, protected wl:WinstonLoggerService) {
        this.loadSecrets();
    }

    private loadSecrets(): void {
        try {
            const secrets = {};

            this.secretFiles.forEach( (file) => {
                const fullPath = path.join( process.cwd() , file );
                if (!existsSync( fullPath )) {
                    this.wl.warn( `⚠️ Secret file not found: ${fullPath}` );
                    return;
                }

                const rawContent = readFileSync( fullPath , 'utf8' ).trim();
                const parsedSecrets = JSON.parse( rawContent );
                Object.assign( secrets , parsedSecrets ); // ✅ Merge loadSecrets
            } );
            this.secrets = secrets;
            Object.entries(secrets).forEach(([key, value]) => {
                process.env[key] = String(value);  // ✅ Directly set in process.env
            });
            // console.log( process.env);
           /* const envPath = '.env';
            let existingEnv = {};
            if (existsSync(envPath)) {
                const envFileContent = readFileSync(envPath, 'utf8').trim();
                existingEnv = dotenv.parse(envFileContent); // ✅ Parse existing `.env`
            }

            // ✅ Merge new loadSecrets into existing `.env` without duplicates
            const updatedSecrets = { ...existingEnv, ...loadSecrets };


            // Convert loadSecrets to .env format
            const envContent = Object.entries( updatedSecrets )
                .map( ([key , value]) => `${key}=${value}` )
                .join( '\n' );

            // Avoid overwriting existing .env (Append if needed)
            writeFileSync(envPath, envContent);


            // ✅ Load updated .env file into `process.env`
            dotenv.config();*/

        } catch (error) {
            this.wl.error( `❌ Failed to load secrets: ${error.message}` );
            throw new Error( `Failed to load secrets: ${error.message}` );
        }
    }
}