import { Module, Global } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Pool } from "pg";
import * as fs from "fs";
import { join } from "path";

const databasePoolFactory = async (configService: ConfigService) => {
  try {
  const projectRoot = process.cwd();
  const configPath = join(
    projectRoot,
    "src",
    "certificates",
    "ap-south-1-bundle.pem",
  );
  if (!fs.existsSync(configPath)) {
    throw new Error(`Certificate file not found at path: ${configPath}`);
  }
  return new Pool({
    user: configService.get("PG_DB_USERNAME"),
    host: configService.get("PG_DB_HOST"),
    database: configService.get("PG_DB_NAME"),
    password: configService.get("PG_DB_PASSWORD"),
    port: configService.get<number>("PG_DB_PORT"),
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
    // ssl: {
    //   rejectUnauthorized: true,
    //   ca: fs.readFileSync(configPath).toString(),
    // },
  });
  } catch (error) {
    console.error("Failed to create database pool:", error);
    throw new Error("Database pool initialization failed.");
  }
  
};

@Global() // Makes the module available globally
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: "DATABASE_POOL",
      inject: [ConfigService],
      useFactory: databasePoolFactory,
    },
  ],
  exports: ["DATABASE_POOL"],
})
export class DatabaseModule {}
