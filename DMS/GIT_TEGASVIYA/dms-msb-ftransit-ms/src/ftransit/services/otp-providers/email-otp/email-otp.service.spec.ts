// email-otp.service.spec.ts
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailOtpService } from './email-otp.service';
import { CODE, fmsgs, generateResponse } from '../../enum/common_messages.enum';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('EmailOtpService', () => {
  let service: EmailOtpService;
  let sendMailMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.EMAIL_USERNAME = 'test@example.com';
    process.env.EMAIL_APP_PWD = 'password123';

    sendMailMock = jest.fn();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    service = new EmailOtpService();
  });

  describe('constructor', () => {
    it('should initialize transporter with Gmail configuration', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_APP_PWD,
        },
      });
    });
  });

  describe('sendOtp', () => {
    it('should send OTP successfully and return success response', async () => {
      sendMailMock.mockResolvedValueOnce({});
      const spyLog = jest.spyOn(Logger.prototype, 'log').mockImplementation();

      const result = await service.sendOtp('user@example.com', '123456');

      // Check mail content
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: process.env.EMAIL_USERNAME,
          to: 'user@example.com',
          subject: 'Your OTP Code',
          text: expect.stringContaining('123456'),
          html: expect.stringContaining('<strong>123456</strong>'),
        })
      );

      // Check logger
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('OTP sent to user@example.com'));

      // Check full generateResponse output
      expect(result).toEqual(
        generateResponse(200, CODE.SUCCESS, fmsgs.OTP_SUCCESS_MSG, { email: 'user@example.com' })
      );
    });

    it('should handle sendMail failure and return error response', async () => {
      const error = new Error('SMTP fail');
      sendMailMock.mockRejectedValueOnce(error);
      const spyError = jest.spyOn(Logger.prototype, 'error').mockImplementation();

      const result = await service.sendOtp('user@example.com', '123456');

      // Check logger error
      expect(spyError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send OTP to user@example.com'),
        error.stack
      );

      // Check full generateResponse output
      expect(result).toEqual(
        generateResponse(400, CODE.ERROR, fmsgs.OTP_FAILURE_MSG, { email: 'user@example.com' })
      );
    });
  });
});
