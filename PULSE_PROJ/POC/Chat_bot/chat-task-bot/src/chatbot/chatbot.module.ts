import { Module, forwardRef } from '@nestjs/common';
import { ChatbotController } from './controller/chatbot.controller';
import { ChatService } from './service/chat.servcie';
import { DatabaseModule } from '../database/database.module';
import { WinstonLoggerService } from '../winstonlogger/winstonlogger.service';

@Module({
  imports: [forwardRef(() => DatabaseModule)],
  controllers: [ChatbotController],
  providers: [
    ChatService,
     WinstonLoggerService],
})
export class ChatbotModule {}
