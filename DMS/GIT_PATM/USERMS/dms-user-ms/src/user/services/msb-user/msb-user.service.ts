import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { KeycloakService } from '../keycloak/keycloak.service';
import { ConfigService } from '@nestjs/config';
import { OnboarduserService } from '../onboarduser/onboarduser.service';
import { HttpService } from '@nestjs/axios';
import { WinstonLoggerService } from '../winstonlogger/winstonlogger.service';
import { CODE, generateResponse, MESSAGE } from 'src/user/enum/user.enum';
import { lastValueFrom } from 'rxjs';
import { currentTimestamp, generateSecureOtp } from '../utils/common';
import { queryService } from '../query/query.service';
import { Pool } from "pg";

@Injectable()
export class MsbUserService {
    private readonly client_uuid:string;
    public readonly client_id: string;
    constructor(public http: HttpService,public configService: ConfigService,
        protected readonly keycloakService: KeycloakService, protected onboardService: OnboarduserService,
        protected readonly wl: WinstonLoggerService,  private qs: queryService,
        @Inject("DATABASE_POOL") private readonly pool: Pool) {
        this.client_uuid = this.configService.get<string>('CLIENT_UUID', '');
        this.client_id = this.configService.get<string>('CLIENT_ID', '');
}
    async getUserInitToken(){
        try {
            const clientToken = await this.keycloakService.getAccessToken('user', process.env.MSB_INIT_USER, process.env.MSB_INIT_PASSWORD);
            if(clientToken?.status === HttpStatus.OK){
                return generateResponse(200, CODE.SUCCESS, clientToken.data.data);
            }else{
                return generateResponse(200, CODE.ERROR, MESSAGE.INVALID);
            }
        } catch (error) {
            this.wl.error(error.message);
            return generateResponse(400, CODE.ERROR, error.message);
        }
    }

    async initiateRegistrationForMsbUser(idf: string,  token: string, email?: string,){
        try {
           
            const clientToken = await this.keycloakService.getAccessToken( 'client' );
            const userDetails = await this.keycloakService.getUserData( idf , 'username' , clientToken.data.data );
            if (userDetails?.data?.code  === CODE.SUCCESS) {
                this.generateOtpAndSend(idf,token, email);
                return generateResponse(200, CODE.SUCCESS, MESSAGE.USER_EXISTS);
            } else {
                return this.checkForIdentifier(idf ,token, email);
            }
        } catch (error) {
            this.wl.error(error.message);
            return generateResponse(400, CODE.ERROR, error.message);
        }

    }

    async checkForIdentifier(idf: string,  token: string, email?: string){
        const url  = process.env.AXIOS_URL + '/registry/devices/details/get';
        try {
            const result:any = await lastValueFrom(this.http.post(url, {device_id:'+91'+idf}, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
            }}));
            if (result.status === HttpStatus.OK && result?.data?.data?.length > 0) {
                let name =  result.data.data[0].allocated_merchant || '';
                this.processOnboarding(idf, name ,token, email);
                return generateResponse(200, CODE.CREATED, MESSAGE.SUCCESS);
            } else {
                return generateResponse(200, CODE.INVALID, MESSAGE.INVALID);
            }
        } catch (error) {
            console.error(error)
            this.wl.error(error.message);
            return generateResponse(400, CODE.ERROR, error.message);
        }
    }

    async processOnboarding(idf: string, name: string, token: string, email?: string) {
        try {
        let url = process.env.AXIOS_URL + '/requests/wfevents?action=ONBOARD_MSB';
        let body = {
            "event": "ONBOARD_MSB",
            "event_by": process.env.MSB_INIT_USER,
            "edetails": [
              {
                "user_info": {
                  "username": idf, //adding @example.com bcos during user onboadring in DMS email is same as username and assignClientRoles is using username to fetch user details
                  "fname": name,
                  "lname": name,
                  "email": email,
                  "user_org": "ExampleOrg"
                },
                "user_role": "MSB-User"
              }
            ]
          }
          
        const onboardMsbUser = await lastValueFrom(this.http.post(url, body, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
        }}));
        if( onboardMsbUser.status === HttpStatus.CREATED || onboardMsbUser.status === HttpStatus.OK){ 
            this.wl.log('Onboarding request initiated successfully');
            this.generateOtpAndSend(idf,token, email, true);

            return generateResponse(200, CODE.SUCCESS, MESSAGE.SUCCESS, onboardMsbUser.data);
        }else{
            this.wl.error('Onboarding request failed');
            return generateResponse(400, CODE.ERROR, MESSAGE.ERROR);
        }
        } catch (error) {
            this.wl.error(error.message);
            return generateResponse(400, CODE.ERROR, error.message);
        }
    }

    


    async generateOtpAndSend(
    idf: string,
    token: string,
    email?: string,
    shouldRetry: boolean = false
    ) {
    try {
        this.wl.log("Called generateOtpAndSend");
        const ftype = process.env.FACTOR_TYPE || 'otp';
        const clientToken = await this.keycloakService.getAccessToken('client');
        let isUserExists = await this.keycloakService.getUserData(idf, 'username', clientToken?.data?.data);

        if (isUserExists?.data?.code !== CODE.SUCCESS) {
        if (!shouldRetry) {
            this.wl.warn("User does not exist and retry is disabled.");
            return generateResponse(200, CODE.INVALID, MESSAGE.OTP_GENERATION_FAILED);
        }


        isUserExists = await this.retryWithDelay(
            () => this.keycloakService.getUserData(idf, 'username', clientToken?.data?.data),
            (res) => res?.data?.code === CODE.SUCCESS,
            5, // maxRetries
            3000, // delayMs
            this.wl
        );

        if (!isUserExists) {
            return generateResponse(200, CODE.INVALID, "User not available in Keycloak after retry. Please try again later.");
        }
        }

        // Proceed with OTP generation
        this.wl.log("User exists. Generating OTP.");
        const otp = await generateSecureOtp();
        if (!otp) throw new Error("OTP generation failed");

        const addfactorQuery = await this.qs.addOtpfactor();
        const insertResult = await this.pool.query(addfactorQuery, [idf, 'otp', currentTimestamp(), otp]);

        if (insertResult.rowCount > 0) {
        const url = process.env.AXIOS_URL + '/ftransit/otp';
        const sendResult = await lastValueFrom(
            this.http.post(
            url,
            { otp, email, ftype },
            { headers: { Authorization: `Bearer ${token}` } }
            )
        );

        if ([HttpStatus.OK, HttpStatus.CREATED].includes(sendResult?.status)) {
            this.wl.log("OTP sent successfully.");
            return generateResponse(200, CODE.SUCCESS, MESSAGE.OTP_GENERATED);
        } else {
            this.wl.error("Failed to send OTP.");
            return generateResponse(200, CODE.INVALID, MESSAGE.OTP_GENERATION_FAILED);
        }
        } else {
        throw new Error("Failed to insert OTP factor into DB");
        }
    } catch (error) {
        this.wl.error(error.message);
        return generateResponse(400, CODE.ERROR, error.message);
    }
    }


     

    async validateOtp(idf: string, otp: string) {  
        try {
            const validateOtpQuery = await this.qs.validateOtpFactor();
            const result = await this.pool.query(validateOtpQuery, [idf, 'otp', otp]);
            if (result.rowCount > 0) {
                this.wl.log('OTP validated successfully');
                const result = await this.keycloakService.getAccessToken('user', idf, this.onboardService.defaultPassword);
            if(result?.data?.code === CODE.SUCCESS) {
                const data = result?.data?.data;
                return generateResponse(200, CODE.SUCCESS, {...data, accountSetupComplete: false })
            }else{
                this.wl.error('Failed to get access token');
                return generateResponse(200, CODE.SUCCESS, {accountSetupComplete: true});
            }
                

            } else {
                this.wl.error('Invalid OTP');
                return generateResponse(200, CODE.INVALID, MESSAGE.INVALID);
            }
        } catch (error) {
            this.wl.error(error.message);
            return generateResponse(400, CODE.ERROR, error.message);
        } 
    }

    async  retryWithDelay<T>(
        taskFn: () => Promise<T>,
        validateFn: (result: T) => boolean,
        maxRetries: number,
        delayMs: number,
        logger?: { log: Function; warn: Function }
      ): Promise<T | null> {
        let attempt = 0;
      
        while (attempt < maxRetries) {
          attempt++;
          try {
            const result = await taskFn();
            if (validateFn(result)) {
              logger?.log?.(`Success on attempt ${attempt}`);
              return result;
            }
            logger?.warn?.(`Validation failed on attempt ${attempt}`);
          } catch (err: any) {
            logger?.warn?.(`Error on attempt ${attempt}: ${err.message}`);
          }
      
          if (attempt < maxRetries) {
            await new Promise(res => setTimeout(res, delayMs));
          }
        }
      
        logger?.warn?.(`All ${maxRetries} attempts failed.`);
        return null;
      }
      
}
