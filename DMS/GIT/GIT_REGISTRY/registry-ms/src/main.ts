import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {

  const httpsOptions = {
    key:  Buffer.from(process.env.HTTPS_KEY , 'base64').toString('ascii'),
    cert: Buffer.from(process.env.HTTPS_CRT , 'base64').toString('ascii')
  };
  // const app = await NestFactory.create(AppModule, {httpsOptions});
  const app = await NestFactory.create(AppModule);

  app.enableCors()
  await app.listen(3007);
}
bootstrap();
