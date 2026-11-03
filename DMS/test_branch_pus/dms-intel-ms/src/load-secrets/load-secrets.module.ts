import {Module , Global , forwardRef} from "@nestjs/common";
import { LoadSecretsService } from "./load-secrets.service";
import {WinstonLoggerService} from "../common/winstonlogger/winstonlogger.service";
import {IntelModule} from "../intel/intel.module";

@Global() // ✅ Makes it available in all modules without re-importing
@Module({
            imports: [forwardRef(() =>IntelModule ) ],
            providers: [LoadSecretsService, WinstonLoggerService],
            exports: [LoadSecretsService, WinstonLoggerService], // ✅ Export so other modules can use it
        })
export class LoadSecretsModule {}
