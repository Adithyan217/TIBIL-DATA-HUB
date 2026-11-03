import {Body , Controller , Delete , Get , Headers , Patch , Post , Put , Req , Res} from '@nestjs/common';
import {UserService} from "../services/user.service";
import {Response} from "express";
import { OnboarduserService } from '../services/onboarduser/onboarduser.service';
import {WinstonLoggerService} from "../services/winstonlogger/winstonlogger.service";
import { MsbUserService } from '../services/msb-user/msb-user.service';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService,
                private obu: OnboarduserService, protected wl:WinstonLoggerService, private msbService: MsbUserService) {}

   

    @Get('ping')
    ping( @Res() res, @Req() req: any) {
        // this.infoCommonLogger(req);
        res.status(200).send(`user-ms operational version is: ${process.env.MAJOR_VERSION}.${process.env.MINOR_VERSION}`);
    }

    @Post('/session')
    async userLogin(@Body() body: any, @Res() res: Response, @Req() req , @Headers() header:any ) {
        try {   
            const result: any = await this.userService.Login( body );
            res.status( result.status ).send( result.data );
        }catch (e) {
            // this.errorCommonLogger(req, e);
            res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
        }
    }

    @Post('')
    async createUser(@Body() body: any, @Res() res: Response, @Headers() header: any, @Req() req ) {
        // let bodyData = body.edetails[0];
        try {
            // this.infoCommonLogger(req);
            const token = header.authorization.split(' ')[1];
            let role = req?.user?.role ;
            console.log("role", role);
            const result: any = await this.obu.onboardUser(body, token, role);
            res.status(result?.code===2000? 201: 400).send(result);
        } catch (e) {
            // this.errorCommonLogger(req, e);
            res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
        }
    }

    @Delete('/session')
    async userLogout(@Headers() header: any,@Body() body: any, @Res() res: Response, @Req() req  ) {
        try {
            // this.infoCommonLogger(req);
           const token =  header.authorization.split(' ')[1];
            const result: any = await this.userService.logout(token);
            res.status(result.status).send(result.data);
        }catch (e) {
            // this.errorCommonLogger(req, e);
            res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
        }

    }

    @Post('/details/get')
    async getUserDetails(@Headers() header: any,@Body() body: any, @Res() res: Response , @Req() req ) {
       try { // const token =  header.authorization.split(' ')[1];
           // this.infoCommonLogger(req);
           if (!body?.email) {
               return res.status( 200 ).send( {
                                                  code : 4000 ,
                                                  message : "Invalid User"
                                              } )
           }
           const result: any = await this.userService.getUserDetails( body );
           res.status( result.status ).send( result.data );
       }catch (e) {
           // this.errorCommonLogger(req, e);
           res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
       }
    }

    @Post('/roles/get')
    async getDmsRoles(@Body() body: any, @Res() res: Response,@Headers() header: any, @Req() req ) {
    try {
        // this.infoCommonLogger(req);
        const result: any = await this.userService.getRoles();
        res.status( result.status ).send( result.data );
    }catch (e) {
        // this.errorCommonLogger(req, e);
        res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
    }
    }

/*    @Put('/change-password')
    async resetPassword(@Body() body: any, @Headers() header: any, @Req() req: any, @Res() res: Response ) {
        const token =  header.authorization.split(' ')[1];
        const result: any = await this.userService.passwordChange(body, token);
        res.status(result.code).send(result);
    }*/


    @Put('/auth')
    async forgotPassword(@Body() body: any, @Res() res: Response, @Req() req , @Headers() header:any ) {
       try {
           const token = header?.authorization?.split( ' ' )[1] || false;
           if (!token)
               return res.status( 200 ).send( { code: 1000, message: "Bearer Token Required"});
           if (token !== process.env.INIT_TOKEN)
               return res.status( 200 ).send( {code: 1000,  message: "Invalid Token"} );

           // this.infoCommonLogger(req);
           const result: any = await this.userService.forgotPassword( body );
           res.status( result.status ).send( result.data );
       }catch (e) {
           // this.errorCommonLogger(req, e);
           res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
       }
    }

    @Post('/pin')
    async resetPinForProfile(@Body() body: any, @Res() res: Response, @Req() req , @Headers() header:any ) {
       try {
           // this.infoCommonLogger(req);
           let role  = req?.user?.role;
           const result: any = await this.userService.forgotPassword( body );
           res.status( result.status ).send( result.data );
       }catch (e) {
           // this.errorCommonLogger(req, e);
           res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
       }
    }

    @Post('/list/get')
    async usersList(@Body() body, @Res() res: Response, @Req() req  , @Headers() header: any) {

        try{
            // this.infoCommonLogger(req);
            const token = header.authorization.split(' ')[1];
            const result: any = await this.userService.getUserListByOrg(body, req,token);
            res.status(result.status).send(result.data)
        }catch (e) {
            // this.errorCommonLogger(req, e);
            res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
        }
    }
        @Post('/search/get')
        async searchUsers(@Body() body, @Headers() header, @Res() res: Response , @Req() req ) {
        try {
            // this.infoCommonLogger(req);
            const token = header?.authorization?.split( ' ' )[1] || '';
            const result: any = await this.userService.searchUser( token , body );
            res.status( result.status ).send( result.data );
        }catch (e) {
            // this.errorCommonLogger(req, e);
            res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
        }

    }

    @Patch('')
    async updateUserDetails(@Headers() headers: any,@Body() body: any, @Res() res: Response, @Req() req ) {
        try {
            // this.infoCommonLogger(req);
            const token = headers.authorization.split(' ')[1];
            const result: any = await this.userService.updateUserDetails( body?.edetails[0],token );
            res.status( result.status ).send( result.data);
        }catch (e) {
            // this.errorCommonLogger(req, e);
            res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
        }
    }
    @Post('/ui-permissions/get')
    async getUiPermission(@Body() body: any, @Res() res: Response, @Req() req  ) {
       try {
             // this.infoCommonLogger(req);
           const result: any = await this.userService.getUiRolePermisssions(req);
           res.status(result.status).send(result.data);
       } catch (e) {
           // this.errorCommonLogger(req, e);
           res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
       }

    }
    @Post('/firebase-config/get')
    async getFirebaseConfig(@Body() body: any, @Res() res: Response, @Req() req, @Headers() header ) {
        try
        {
            const userAgent = header['user-agent'] || '';
            const blockedAgents = ['PostmanRuntime', 'curl', 'Insomnia', 'HTTPie'];
            if (blockedAgents.some(agent => userAgent.includes(agent))) {
                return res.status(403).send({ code: 4003, message: "Forbidden: Invalid Client" });
            }
            const token = header?.authorization?.split( ' ' )[1] || false;
            if (!token)
                return res.status( 200 ).send( { code: 1000, message: "Bearer Token Required"});
             if (token !== process.env.INIT_TOKEN)
                 return res.status( 200 ).send( {code: 1000,  message: "Invalid Token"} );

            // this.infoCommonLogger(req);
            const result: any = await this.userService.firebaseConfig();
            res.status(result.status).send(result.data);
        } catch (e) {
            // this.errorCommonLogger(req, e);
            res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
        }
    }
    @Post('/roles/availability/get')
    async getRoleAvailability(@Body() body: any, @Res() res: Response, @Req() req ) {
        try{

            const result: any = await this.userService.getUserAvailableRoles(req, 'role');
            res.status(result.status).send(result.data);
        }
        catch (e) {
            res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
        }
    }

    @Post('/dtypes/get')
    async getDtypesForRole(@Body() body: any, @Res() res: Response, @Req() req ) {
        try{

            const result: any = await this.userService.getUserAvailableRoles(req, 'dtype');
            res.status(result.status).send(result.data);
        }
        catch (e) {
            res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
        }
    }

    @Post('/init')
    async getGuestToken(@Body() body: any, @Res() res: Response, @Req() req, @Headers() header:any){
        try {
            const token = header?.authorization?.split( ' ' )[1] || false;
            if (!token)
                return res.status( 200 ).send( { code: 1000, message: "Bearer Token Required"});
            if (token !== process.env.INIT_TOKEN)
                return res.status( 200 ).send( {code: 1000,  message: "Invalid Token"} );
            const result: any = await this.msbService.getUserInitToken();
            res.status(result.status).send(result.data);
        } catch (e) {
            this.wl.error(`Error in getting guest token: ${e?.message}`);
            res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
        }
    }

    @Post('/registration')
    async checkIfDeviceExists(@Body() body: any, @Res() res: Response, @Req() req, @Headers() header:any){
        try {
            const token = header?.authorization?.split( ' ' )[1] || false;
            console.log('token', req?.user?.role);
            if(!body?.identifier ) {
                return res.status(200).send({code: 4000, message: "Identifier is required"});
            }
            const result: any = await this.msbService.initiateRegistrationForMsbUser(body?.identifier, token, body?.email);
            res.status(result.status).send(result.data);
        } catch (e) {
            this.wl.error(`Error in getting guest token: ${e?.message}`);
            res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
        }
    }

    @Post('/otp')
    async processOtpGeneration(@Body() body: any, @Res() res: Response, @Req() req, @Headers() header:any){
        try {
            if(!body?.identifier) {
                return res.status(200).send({code: 4000, message: "Identifier is required"});
            }
            const token = header?.authorization?.split( ' ' )[1] || false;
            const result: any = await this.msbService.generateOtpAndSend(body?.identifier, token, body?.email);
            res.status(result.status).send(result.data);
        } catch (e) {
            this.wl.error(`Error in getting guest token: ${e?.message}`);
            res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
        }
    }

    @Put('/otp')
    async verifyOtp(@Body() body: any, @Res() res: Response, @Req() req, @Headers() header:any){
        try {
            if(!body?.identifier || !body?.otp) {
                return res.status(200).send({code: 4000, message: "Identifier is required"});
            }
            const result: any = await this.msbService.validateOtp(body?.identifier, body?.otp);
            res.status(result.status).send(result.data);
        } catch (e) {
            this.wl.error(`Error in getting guest token: ${e?.message}`);
            res.status(e.statusCode || 500).send({message: e.message || 'An unexpected error occurred'});
        }
    }

}
