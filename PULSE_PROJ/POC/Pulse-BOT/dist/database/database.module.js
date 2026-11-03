"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DatabaseModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const pg_1 = require("pg");
const winstonlogger_service_1 = require("../winstonlogger/winstonlogger.service");
const winstonlogger_module_1 = require("../winstonlogger/winstonlogger.module");
let DatabaseModule = DatabaseModule_1 = class DatabaseModule {
    wl;
    logger = new common_1.Logger(DatabaseModule_1.name);
    constructor(wl) {
        this.wl = wl;
    }
    async onModuleDestroy() {
        this.logger.log('🛑 Closing database connections...');
        const pool = global['DATABASE_POOL'];
        if (pool) {
            await pool.end();
            this.logger.log('✅ Database connections closed successfully.');
        }
    }
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = DatabaseModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [winstonlogger_module_1.WinstonLoggerModule],
        providers: [
            {
                provide: 'DATABASE_POOL',
                inject: [config_1.ConfigService, winstonlogger_service_1.WinstonLoggerService],
                useFactory: async (configService, wl) => {
                    const logger = new common_1.Logger('DatabaseModule');
                    if (!process.env['PG-DB-HOST'] ||
                        !process.env['PG-DB-USERNAME'] ||
                        !process.env['PG-DB-PASSWORD'] ||
                        !process.env['PG-DB-NAME'] ||
                        !process.env['PG-DB-PORT']) {
                        logger.error('❌ One or more DB environment variables are missing.');
                        throw new Error('❌ DB environment variables missing.');
                    }
                    const dbConfig = {
                        user: process.env['PG-DB-USERNAME'],
                        host: process.env['PG-DB-HOST'],
                        database: process.env['PG-DB-NAME'],
                        password: process.env['PG-DB-PASSWORD'],
                        port: Number(process.env['PG-DB-PORT']),
                        max: 10,
                        idleTimeoutMillis: 30000,
                        connectionTimeoutMillis: 15000,
                    };
                    let pool;
                    try {
                        logger.log('⏳ Connecting to PostgreSQL database...');
                        pool = new pg_1.Pool(dbConfig);
                        await pool.query('SELECT 1');
                        logger.log('✅ Successfully connected to PostgreSQL.');
                    }
                    catch (error) {
                        logger.error(`❌ Database connection error: ${error.message}`);
                        throw new Error('Failed to establish database connection.');
                    }
                    return pool;
                },
            },
        ],
        exports: ['DATABASE_POOL'],
    }),
    __metadata("design:paramtypes", [winstonlogger_service_1.WinstonLoggerService])
], DatabaseModule);
//# sourceMappingURL=database.module.js.map