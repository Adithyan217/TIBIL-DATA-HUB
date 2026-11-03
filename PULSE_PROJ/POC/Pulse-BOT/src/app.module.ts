import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { WinstonLoggerModule } from './winstonlogger/winstonlogger.module';
import { ChatbotModule } from './chatbot/chatbot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WinstonLoggerModule,
    DatabaseModule,
    ChatbotModule,
  ],
})
export class AppModule {}
