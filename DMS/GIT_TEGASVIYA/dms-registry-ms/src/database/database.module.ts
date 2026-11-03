import { Module, Global, OnModuleDestroy, Logger, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import * as fs from 'fs';
import { join } from 'path';
import { WinstonLoggerService } from '../common/service/winstonlogger/winstonlogger.service';
import { CommonModule } from '../common/common.module';

@Global()
@Module({
  imports: [forwardRef(() => CommonModule)],
  providers: [
    {
      provide: 'DATABASE_POOL',
      inject: [ConfigService, WinstonLoggerService],
      useFactory: async (configService: ConfigService, wl: WinstonLoggerService) => {



        const logger = new Logger('DatabaseModule');

        // Validate required environment variables using bracket notation with dashes
        if (
          !process.env['PG-DB-HOST'] ||
          !process.env['PG-DB-USERNAME'] ||
          !process.env['PG-DB-PASSWORD'] ||
          !process.env['PG-DB-NAME'] ||
          !process.env['PG-DB-PORT']
        ) {
          logger.error('❌ One or more DB environment variables are missing.');
          throw new Error('❌ DB environment variables missing.');
        }

        const projectRoot = process.cwd();
        const configPath = join(projectRoot, 'src', 'database', 'ap-south-1-bundle.pem');

        if (!fs.existsSync(configPath)) {
          logger.error(`❌ Certificate file not found at path: ${configPath}`);
          throw new Error('Database SSL certificate missing.');
        }

        const dbConfig = {
          user: process.env['PG-DB-USERNAME'],
          host: process.env['PG-DB-HOST'],
          database: process.env['PG-DB-NAME'],
          password: process.env['PG-DB-PASSWORD'],
          port: Number(process.env['PG-DB-PORT']),
          max: 10, // Max clients in pool
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 15000,
          // ssl: {
          //   rejectUnauthorized: true,
          //   ca: fs.readFileSync(configPath).toString(),
          // }
        };

        let pool: Pool;
        try {
          logger.log('⏳ Connecting to PostgreSQL database...');
          pool = new Pool(dbConfig);
          await pool.query('SELECT 1'); // Test connection
          logger.log('✅ Successfully connected to PostgreSQL.');
        } catch (error) {
          logger.error(`❌ Database connection error: ${error.message}`);
          throw new Error('Failed to establish database connection.');
        }

        return pool;
      },
    },
  ],
  exports: ['DATABASE_POOL'],
})
export class DatabaseModule implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseModule.name);
  constructor(private readonly wl: WinstonLoggerService) {}

  async onModuleDestroy() {
    this.logger.log('🛑 Closing database connections...');
    const pool: Pool = (global as any)['DATABASE_POOL'];
    if (pool) {
      await pool.end();
      this.logger.log('✅ Database connections closed successfully.');
    }
  }
}