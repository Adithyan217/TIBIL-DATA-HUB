import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { writeFileSync, existsSync, appendFileSync } from 'fs';
import * as path from 'path';

import * as dotenv from 'dotenv';
@Injectable()
export class LoadSecretsService {
    private readonly envFiles = [
        `src/secrets/${process.env.ENVIRONMENT}-common-secrets`,
        `src/secrets/${process.env.ENVIRONMENT}-drouter-ms`,
        `src/secrets/${process.env.ENVIRONMENT}-ptransit-ms`
    ];
    private readonly secretFiles: string[] = [
        `src/secrets/${process.env.ENVIRONMENT}-dlistner-config`
    ];

    public secrets = {};
    public envSecrets = {};
    public metricConfig= {}
    constructor(private readonly configService: ConfigService) {
        // this.loadSecrets();
         this.envSecrets = this.getSecrets(this.envFiles);
        Object.entries(this.envSecrets).forEach(([key, value]) => {
            process.env[key] = String(value);  // ✅ Directly set in process.env
        });

        const config = this.getSecrets(this.secretFiles);
        Object.entries(config).forEach(([key, value]:any) => {
            this.metricConfig[key] = JSON.parse(value);  // ✅ Directly set in process.env
        });

    }


    private getSecrets(files: string[]) {
        const secrets = {};

        files.forEach( (file) => {
            const fullPath = path.join( process.cwd() , file );
            if (!existsSync( fullPath )) {
                console.warn( `⚠️ Secret file not found: ${fullPath}` );
                return;
            }

            const rawContent = readFileSync( fullPath , 'utf8' ).trim();
            const parsedSecrets = JSON.parse( rawContent );
            Object.assign( secrets , parsedSecrets ); // ✅ Merge loadSecrets
        } );
        return secrets;
    }
}