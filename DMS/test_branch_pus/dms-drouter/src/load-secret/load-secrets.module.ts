import { Module, Global } from "@nestjs/common";
import { LoadSecretsService } from "./load-secret.service";

@Global() // ✅ Makes it available in all modules without re-importing
@Module({
            providers: [LoadSecretsService],
            exports: [LoadSecretsService], // ✅ Export so other modules can use it
        })
export class LoadSecretsModule {}
