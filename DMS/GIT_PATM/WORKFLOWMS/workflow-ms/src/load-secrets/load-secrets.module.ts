import {Module , Global , forwardRef} from "@nestjs/common";
import { LoadSecretsService } from "./load-secrets.service";
import {RequestsModule} from "../requests/requests.module";
import {WinstonLoggerService} from "../requests/services/winstonlogger/winstonlogger.service";

@Global() // ✅ Makes it available in all modules without re-importing
@Module({
            imports: [forwardRef(() => RequestsModule)],
            providers: [LoadSecretsService, WinstonLoggerService],
            exports: [LoadSecretsService], // ✅ Export so other modules can use it
        })
export class LoadSecretsModule {}
