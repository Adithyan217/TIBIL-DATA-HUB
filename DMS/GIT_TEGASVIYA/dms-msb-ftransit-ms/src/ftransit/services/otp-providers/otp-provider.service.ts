import { Injectable } from '@nestjs/common';
import { EmailOtpService } from './email-otp/email-otp.service';
import { generate } from 'rxjs';
import { CODE, fmsgs, generateResponse } from '../enum/common_messages.enum';

@Injectable()
export class OtpProviderService {
    constructor(private readonly emailOtp: EmailOtpService) {
        // Initialization logic if needed
    }

    async extractAndRouteToOtpProvider(otpBody: any): Promise<any> {
        try {
            const { ftype, ...rest } = otpBody;
            console.log("OTP Body:", otpBody, rest.email, rest.otp);
            this.processOtpRequest(ftype, rest)
            return generateResponse(200, CODE.SUCCESS, fmsgs.OTP_SUCCESS_MSG);  
        } catch (error) {
            return generateResponse(400, CODE.ERROR, fmsgs.OTP_FAILURE_MSG);  
        }
        // Extract the provider from the request body
        
        
    }

    async processOtpRequest(ftype: string, rest: {email: string, otp: string}): Promise<any> {
        const result  = await this[ftype].sendOtp(rest.email, rest.otp)
        return result
    }
}
