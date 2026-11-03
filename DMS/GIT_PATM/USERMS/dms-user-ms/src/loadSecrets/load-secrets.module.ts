import {Module , Global , forwardRef} from "@nestjs/common";
import { UserModule } from "src/user/user.module";
import { WinstonLoggerService } from "src/user/services/winstonlogger/winstonlogger.service";
import { LoadSecretsService } from "./loadSecrets.service";

@Global() // ✅ Makes it available in all modules without re-importing
@Module({
            imports: [forwardRef(() => UserModule)],
            providers: [LoadSecretsService, WinstonLoggerService],
            exports: [LoadSecretsService], // ✅ Export so other modules can use it
        })
export class LoadSecretsModule {}
