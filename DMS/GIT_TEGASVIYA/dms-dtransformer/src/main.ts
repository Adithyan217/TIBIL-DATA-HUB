import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import {GlobalInterceptor} from "./global.interceptor";

function loadSecretsSync() {
  const env = process.env.ENVIRONMENT;
  if (!env) {
    throw new Error('ENVIRONMENT variable not set.');
  }

  const envVars = [
    `${env}-apprunner-common-secrets`,    
  ];

  for (const varName of envVars) {
    const secretJsonString = process.env[varName];
    if (!secretJsonString) {
      console.warn(`Secret env variable missing: ${varName}`);
      continue;
    }

    try {
      const secrets = JSON.parse(secretJsonString);
      for (const [key, value] of Object.entries(secrets)) {
        process.env[key] = String(value);  // Convert value to string
      }
    } catch (error) {
      console.error(`Failed to parse secrets from env variable ${varName}:`, error);
      throw error;
    }
  }
}


async function bootstrap() {
  if (process.env.ENVIRONMENT === 'prod') {
    loadSecretsSync(); // Load secrets before app starts
  }
// Now create the main app with HTTPS options
  const key = process.env["HTTPS-KEY"];
  const cert = process.env["HTTPS-CRT"];
  const port = process.env.PORT || 3005;

  const httpsOptions = key && cert ? {
    key: Buffer.from(key, 'base64').toString('ascii'),
    cert: Buffer.from(cert, 'base64').toString('ascii'),
  } : undefined;

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });
  app.useGlobalInterceptors( new GlobalInterceptor())
  app.enableCors();

  await app.listen(port, () => {
    console.log(`[INFO] Server is running on port ${port}`);
  });
}

bootstrap();