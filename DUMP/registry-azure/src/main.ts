import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalInterceptor } from './global.interceptor';
import * as fs from 'fs';
import * as path from 'path';

// Synchronously load secrets and inject into process.env
function loadSecretsSync() {
  const env = process.env.ENVIRONMENT;
  if (!env) {
    throw new Error('ENVIRONMENT variable not set.');
  }

  const envVars = [
    `${env}-drouter-ms`,        
    `${env}-common-secrets`,    
    `${env}-registry-ms`,       
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
  if (process.env.ENVIRONMENT === 'test') {
    loadSecretsSync(); // Load secrets before app starts
  }
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new GlobalInterceptor());
  app.enableCors();

  const port = process.env.PORT || 3007;
  await app.listen(port);

  console.log(`[INFO] Server is running on port ${port}`);
}

bootstrap();
