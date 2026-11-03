import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';

@Controller('chatbot')
export class ChatbotController {
  @Post('webhook')
  async handleMessage(@Body() body: any, @Res() res: Response) {
    res.status(200).json({ text: "Your response message here." });
  }
  
  

}
