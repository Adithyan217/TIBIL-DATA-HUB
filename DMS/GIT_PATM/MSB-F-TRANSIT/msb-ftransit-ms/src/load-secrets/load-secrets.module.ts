import {Module , Global , forwardRef} from "@nestjs/common";
import { LoadSecretsService } from "./load-secrets.service";
import { WinstonLoggerService } from "src/winstonlogger/winstonlogger.service";

@Global() // ✅ Makes it available in all modules without re-importing
@Module({
            providers: [LoadSecretsService, WinstonLoggerService],
            exports: [LoadSecretsService], // ✅ Export so other modules can use it
        })
export class LoadSecretsModule {}
