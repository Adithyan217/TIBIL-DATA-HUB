import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import * as fs from 'fs';
import { join } from 'path';

const databasePoolFactory = async (configService: ConfigService) => {
  const projectRoot = process.cwd();
  const configPath = join(projectRoot, 'src', 'certificates', 'ap-south-1-bundle.pem');

  return new Pool({
    user: configService.get<string>('PG-DB-USERNAME'),
    host: configService.get<string>('PG-DB-HOST'),
    database: configService.get<string>('PG-DB-NAME'),
    password: configService.get<string>('PG-DB-PASSWORD'),
    port: configService.get<number>('PG-DB-PORT'),
    ssl: {
      require: true,
      rejectUnauthorized: true,
      ca: fs.readFileSync(configPath).toString(),
    },
  });
};


@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'DATABASE_POOL',
      inject: [ConfigService],
      useFactory: databasePoolFactory,
    },
  ],
  exports: ['DATABASE_POOL'],
})
export class DatabaseModule {}
