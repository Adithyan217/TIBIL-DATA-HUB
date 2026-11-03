import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import {GlobalInterceptor} from './global.interceptor';

function loadSecretsSync() {
    const env = process.env.ENVIRONMENT;
    if (!env) {
      throw new Error('ENVIRONMENT variable not set.');
    }
  
    const envVars = [
      `${env}-secrets-workflow-ms`,        
      `${env}-secrets-common`,    
    ];

  
    for (const varName of envVars) {
      const secretJsonString = process.env[varName];
      if (!secretJsonString) {
        continue;
      }
  
      try {
        const secrets = JSON.parse(secretJsonString);
        for (const [key, value] of Object.entries(secrets)) {
          process.env[key] = String(value);  // Convert value to string
        }
      } catch (error) {
        throw error;
      }
    }
  }
  
  
  async function bootstrap() {
    if (process.env.ENVIRONMENT === 'uat' || process.env.ENVIRONMENT === 'prod') {
      loadSecretsSync(); // Load secrets before app starts
    }
    const app = await NestFactory.create(AppModule);
  
    app.useGlobalInterceptors(new GlobalInterceptor());
    app.enableCors();
  
    const port = process.env.PORT || 3006;
    await app.listen(port);
  
    console.log(`[INFO] Server is running on port ${port}`);
  }
bootstrap();