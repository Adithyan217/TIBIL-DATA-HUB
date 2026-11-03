import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {RcacheService} from './dms/services/rcache/rcache.service';
import {DcacheService} from "./dms/services/dcache/dcache.service";
async function bootstrap() {
  // const app = await NestFactory.create(AppModule);
  const httpsOptions = {
    key:  Buffer.from(process.env.HTTPS_KEY , 'base64').toString('ascii'),
    cert: Buffer.from(process.env.HTTPS_CRT , 'base64').toString('ascii')
  };
  const app = await NestFactory.create(AppModule, {httpsOptions});
  app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    next();
  });

  

  await app.listen(3004);
}
bootstrap();