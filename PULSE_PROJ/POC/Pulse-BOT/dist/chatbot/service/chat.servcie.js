"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const googleapis_1 = require("googleapis");
const google_auth_library_1 = require("google-auth-library");
const SERVICE_ACCOUNT_KEY_FILE = '/home/adithyan/Downloads/pulse-dev-477810-29914c7e36e1.json';
const SCOPES = ['https://www.googleapis.com/auth/chat.bot'];
let ChatService = class ChatService {
    async authorize() {
        const auth = new google_auth_library_1.JWT({
            keyFile: SERVICE_ACCOUNT_KEY_FILE,
            scopes: SCOPES,
        });
        await auth.authorize();
        return auth;
    }
    async sendGoogleChatMessage(spaceName, message) {
        if (!spaceName)
            throw new Error('No Google Chat space name provided');
        const auth = await this.authorize();
        const chat = googleapis_1.google.chat({ version: 'v1', auth });
        await chat.spaces.messages.create({
            parent: spaceName,
            requestBody: message,
        });
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)()
], ChatService);
//# sourceMappingURL=chat.servcie.js.map