import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const httpsKey = process.env.HTTPS_KEY;
  const httpsCrt = process.env.HTTPS_CRT;
  if (!httpsKey || !httpsCrt) {
    throw new Error('NOT SECURE');
  }
   const httpsOptions = {
    key:  Buffer.from(httpsKey , 'base64').toString('ascii'),
    cert: Buffer.from(httpsCrt , 'base64').toString('ascii')
  };
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3006);
}
bootstrap();
