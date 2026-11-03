import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import * as path from 'path';

const SERVICE_ACCOUNT_KEY_FILE = '/home/adithyan/Downloads/pulse-dev-477810-29914c7e36e1.json';
const SCOPES = ['https://www.googleapis.com/auth/chat.bot'];

@Injectable()
export class ChatService {
  private async authorize(): Promise<any> {
    const auth = new JWT({
      keyFile: SERVICE_ACCOUNT_KEY_FILE,
      scopes: SCOPES,
    });
    await auth.authorize();
    return auth;
  }

  async sendGoogleChatMessage(spaceName: string, message: any): Promise<void> {
    if (!spaceName) throw new Error('No Google Chat space name provided');
    const auth = await this.authorize();
    const chat = google.chat({ version: 'v1', auth });
    await chat.spaces.messages.create({
      parent: spaceName,
      requestBody: message,
    });
  }
}
