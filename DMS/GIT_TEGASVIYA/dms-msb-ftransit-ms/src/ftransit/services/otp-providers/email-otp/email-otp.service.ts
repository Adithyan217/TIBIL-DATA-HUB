import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { CODE, fmsgs, generateResponse } from '../../enum/common_messages.enum';

@Injectable()
export class EmailOtpService {
  private readonly logger = new Logger(EmailOtpService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Gmail auto-configures host/port
      auth: {
        user: process.env["EMAIL-USERNAME"],
        pass: process.env["EMAIL-APP-PWD"],
      },
    });
  }

  public async sendOtp(email: string, otp: string): Promise<void> {
    try {
      const mailOptions = {
        from: `${process.env["EMAIL-USERNAME"]}`,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}`,
        html: `<p>Your OTP code is: <strong>${otp}</strong></p>`,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`OTP sent to ${email}`);
      return generateResponse(200, CODE.SUCCESS, fmsgs.OTP_SUCCESS_MSG, { email });
    } catch (error) {
      console.error(error)
      this.logger.error(`Failed to send OTP to ${email}`, error.stack);
      return generateResponse(400, CODE.ERROR, fmsgs.OTP_FAILURE_MSG, { email });

    }
  }
}
