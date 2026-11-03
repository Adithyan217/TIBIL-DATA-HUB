import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { LoadSecretsService } from './load-secret/load-secret.service';

async function bootstrap() {
  // First, load secrets using a temporary application context
  const tempApp = await NestFactory.createApplicationContext(AppModule);
  await tempApp.get(LoadSecretsService);
  // Ensure this method loads secrets into process.env
  await tempApp.close();

  // Now create the main app with HTTPS options
  const key = process.env.HTTPS_KEY;
  const cert = process.env.HTTPS_CRT;
  const port = process.env.PORT || 3004;

  const httpsOptions = key && cert ? {
    key: Buffer.from(key, 'base64').toString('ascii'),
    cert: Buffer.from(cert, 'base64').toString('ascii'),
  } : undefined;

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  app.enableCors();

  await app.listen(port, () => {
    console.log(`[INFO] Server is running on port ${port}`);
  });
}

bootstrap();