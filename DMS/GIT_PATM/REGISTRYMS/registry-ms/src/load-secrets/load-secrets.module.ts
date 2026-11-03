import {Module , Global , forwardRef} from "@nestjs/common";
import { LoadSecretsService } from "./load-secrets.service";
import {CommonModule} from "../common/common.module";

@Global() // ✅ Makes it available in all modules without re-importing
@Module({
            imports: [forwardRef(() => CommonModule)],
            providers: [LoadSecretsService],
            exports: [LoadSecretsService], // ✅ Export so other modules can use it
        })
export class LoadSecretsModule {}
