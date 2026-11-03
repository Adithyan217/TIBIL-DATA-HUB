import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { RequestsModule } from "./requests/requests.module";
import { DatabaseModule } from "./database/database.module";
import { ConfigModule } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [
    RequestsModule,
    DatabaseModule,
    HttpModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
