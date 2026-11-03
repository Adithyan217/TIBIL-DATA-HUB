import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { writeFileSync, existsSync, appendFileSync } from 'fs';
import * as path from 'path';

import * as dotenv from 'dotenv';
import {WinstonLoggerService} from "../common/winstonlogger/winstonlogger.service";
import * as fs from "node:fs";
@Injectable()
export class LoadSecretsService {
    private readonly envFiles = [
        `src/secrets/${process.env.ENVIRONMENT}-common-secrets`,
        `src/secrets/${process.env.ENVIRONMENT}-intel-ms`
    ];


    public secrets = {};
    public envSecrets = {};

    constructor(private readonly configService: ConfigService, protected wl:WinstonLoggerService) {
        this.envSecrets = this.formatSecrets(this.envFiles);
        Object.entries(this.envSecrets).forEach(([key, value]) => {
            process.env[key] = String(value);  // ✅ Directly set in process.env
        });
    }


    formatSecrets(secretFiles: string[]): Record<string, any> {
        const secrets: Record<string, any> = {};
        secretFiles.forEach((file) => {
            const fullPath = path.join(process.cwd(), file);
            if (!fs.existsSync(fullPath)) {
                this.wl.warn(`⚠️ Secret file not found: ${fullPath}`);
                return;
            }

            try {
                const rawContent = fs.readFileSync(fullPath, 'utf8').trim();
                const parsedSecrets = JSON.parse(rawContent);
                Object.assign(secrets, parsedSecrets);
            } catch (err) {
                this.wl.error(`❌ Failed to parse secrets file: ${file}`, err);
            }
        });

        return secrets;
    }

    public getSecrets(): Record<string, string> {
        return this.envSecrets;
    }
}