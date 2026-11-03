import { Module, Global, OnModuleDestroy, Logger, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";
import * as fs from "fs";
import { join } from "path";
import { WinstonLoggerService } from "../requests/services/winstonlogger/winstonlogger.service";
import { RequestsModule } from "../requests/requests.module";

@Global()
@Module({
  imports: [forwardRef(() => RequestsModule)],
  providers: [
    {
      provide: "DATABASE_POOL",
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger("DatabaseModule");

        // Load secrets directly from process.env using dash-case keys
        const PG_DB_HOST = process.env["PG-DB-HOST"];
        const PG_DB_USERNAME = process.env["PG-DB-USERNAME"];
        const PG_DB_PASSWORD = process.env["PG-DB-PASSWORD"];
        const PG_DB_NAME = process.env["PG-DB-NAME"];
        const PG_DB_PORT = process.env["PG-DB-PORT"];

        if (!PG_DB_HOST) {
          throw new Error("❌ PG-DB-HOST is missing.");
        }

        const projectRoot = process.cwd();
        const configPath = join(projectRoot, "src", "certificates", "ap-south-1-bundle.pem");

        if (!fs.existsSync(configPath)) {
          logger.error(`❌ Certificate file not found at path: ${configPath}`);
          throw new Error("Database SSL certificate missing.");
        }

        const dbConfig = {
          user: PG_DB_USERNAME,
          host: PG_DB_HOST,
          database: PG_DB_NAME,
          password: PG_DB_PASSWORD,
          port: Number(PG_DB_PORT),
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 15000,
          // ssl: {
          //   rejectUnauthorized: true,
          //   ca: fs.readFileSync(configPath).toString(),
          // }
        };

        let pool: Pool;
        try {
          logger.log("⏳ Connecting to PostgreSQL database...");
          pool = new Pool(dbConfig);
          await pool.query("SELECT 1");
          logger.log("✅ Successfully connected to PostgreSQL.");
        } catch (error) {
          logger.error(`❌ Database connection error: ${error.message}`);
          throw new Error("Failed to establish database connection.");
        }

        return pool;
      },
    },
  ],
  exports: ["DATABASE_POOL"],
})
export class DatabaseModule implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseModule.name);
  constructor(protected wl: WinstonLoggerService) {}

  async onModuleDestroy() {
    this.wl.log("🛑 Closing database connections...");
    const pool: Pool = global["DATABASE_POOL"];
    if (pool) {
      await pool.end();
      this.wl.log("✅ Database connections closed successfully.");
    }
  }
}
