import {Module , Global , OnModuleDestroy , Logger , forwardRef} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";
import * as fs from "fs";
import { join } from "path";
import { UserModule } from "src/user/user.module";
import { WinstonLoggerService } from "src/user/services/winstonlogger/winstonlogger.service";
import { LoadSecretsService } from "src/loadSecrets/loadSecrets.service";
import { LoadSecretsModule } from "src/loadSecrets/load-secrets.module";

@Global()
@Module({
          imports: [LoadSecretsModule, forwardRef(() => UserModule)], // ✅ Import SecretsModule (which exports LoadSecretsService)
          providers: [
            {
              provide: "DATABASE_POOL",
              inject: [LoadSecretsService, ConfigService],
              useFactory: async (loadSecretsService: LoadSecretsService, configService: ConfigService) => {
                const logger = new Logger("DatabaseModule");

                // ✅ Load secrets BEFORE creating DB connection
                const secrets = loadSecretsService.getSecrets();

                if (!secrets.PG_DB_HOST) {
                  throw new Error("❌ PG_DB_HOST is missing. LoadSecretsService did not load correctly.");
                }

                const projectRoot = process.cwd();
                const configPath = join(projectRoot, "src", "certificates", "ap-south-1-bundle.pem");

                if (!fs.existsSync(configPath)) {
                  logger.error(`❌ Certificate file not found at path: ${configPath}`);
                  throw new Error("Database SSL certificate missing.");
                }

                const dbConfig = {
                  user: secrets.PG_DB_USERNAME,
                  host: secrets.PG_DB_HOST,
                  database: secrets.PG_DB_NAME,
                  password: secrets.PG_DB_PASSWORD,
                  port: Number(secrets.PG_DB_PORT),
                  max: 10, // Max number of clients in the pool
                  idleTimeoutMillis: 30000, // Close idle clients after 30s
                  connectionTimeoutMillis: 15000, // Timeout if no response in 15s
                  ssl: {
                    rejectUnauthorized: false,
                    ca: fs.readFileSync(configPath).toString(),
                  },
                };

                let pool: Pool;
                try {
                  logger.log("⏳ Connecting to PostgreSQL database...");
                  pool = new Pool(dbConfig);
                  await pool.query("SELECT 1"); // ✅ Test connection
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
  constructor(private readonly loadSecretsService: LoadSecretsService, protected wl:WinstonLoggerService) {}

  async onModuleDestroy() {
    this.wl.log("🛑 Closing database connections...");
    const pool: Pool = await this.loadSecretsService.getSecrets()["DATABASE_POOL"];
    if (pool) {
      await pool.end();
      this.wl.log("✅ Database connections closed successfully.");
    }
  }
}
