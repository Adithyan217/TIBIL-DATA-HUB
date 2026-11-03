import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { User } from '../interface/user.interface';
import {KeycloakService} from './keycloak/keycloak.service'
import {ConfigService} from "@nestjs/config";
import Bank_Admin from '../../ui-config/Bank_Admin.json'
import Bank_RM from '../../ui-config/Bank_RM.json'
import DMS_Admin from '../../ui-config/DMS_Admin.json'
import {WinstonLoggerService} from "./winstonlogger/winstonlogger.service";
import { generateResponse, CODE, MESSAGE} from '../enum/user.enum'
import {generate} from "rxjs";
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import {OnboarduserService} from "./onboarduser/onboarduser.service";


@Injectable()
export class UserService {
    private readonly client_uuid:string;
    public readonly client_id: string;
constructor(public http: HttpService,public configService: ConfigService,
            protected readonly keycloakService: KeycloakService, protected onboardService: OnboarduserService,
            protected readonly wl: WinstonLoggerService) {
    this.client_uuid = this.configService.get<string>('CLIENT_UUID', '');
    this.client_id = this.configService.get<string>('CLIENT_ID', '');
}

    async Login(body: User ): Promise<{ status: number; data: any }> {
        try {
            if (!body.password) {
                return  generateResponse(200, CODE.INVALID, MESSAGE. PASSWORD_REQUIRED)
            }
            if(!body.username) {
                return generateResponse(200, CODE.INVALID, MESSAGE.USERNAME_REQUIRED);
            }
            const result = await this.keycloakService.getAccessToken('user', body.username, body.password);
            return result;
        } catch (err) {
            throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    async getUserDetails( body) {
        try {
            /*const url = `${this.axios_url}/realms/${this.realms}/protocol/openid-connect/userinfo`;
            const result = await lastValueFrom(this.http.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`, // Ensure you have an admin token
                    "Content-Type": "application/json"
                }
            }));
            console.log("User Info:", result.data);*/

            // const decode = await this.keycloakService.decodeJwt(token);
            const email = body.email;
            const clientToken:any = await this.keycloakService.getAccessToken('client');
            const userDetails = await this.keycloakService.getUserData(email, 'username', clientToken.data.data);
           if (userDetails.data?.code == CODE.SUCCESS) {

              const userData:any = userDetails.data?.data;
              if(!userData.length){
                return  generateResponse(200, CODE.INVALID, MESSAGE.INVALID);

              }
               const filterkeys = ["id", "username", "firstName", "lastName", "email", "attributes"];
               let result = this.getSelectedFields(userData, filterkeys);
               const userId = userData[0]?.id; // Store user ID in a variable to avoid repetition

// Run both asynchronous calls in parallel
               const [roleResponse, groupResponse] = await Promise.all([
                                                                           this.keycloakService.getUserAssociatedClient(userId, clientToken.data.data),
                                                                           this.keycloakService.getUserAssociatedGroup(userId, clientToken.data.data)
                                                                       ]);

// Destructure the responses for cleaner access
               const roleName = roleResponse?.data[0]?.name;
               const groupName = groupResponse?.data[0]?.name;                                                       
// Update the result object
               if (result[0]) {
                   result[0].role = roleName;
                   result[0].org = groupName;
               }


               return generateResponse(200, CODE.SUCCESS, result)


            }
            else {
                return generateResponse(200, CODE.INVALID, MESSAGE.INVALID);

            }

        } catch (error) {
            const errMsg = error?.response?.data || error?.message || 'Unknown error';
            const statusCode = error?.status || 500;
            this.wl.error("Error fetching user info:", errMsg);

            return generateResponse(statusCode, CODE.ERROR, errMsg);

        }

    }

/*    async passwordChange(body, accessToken: string): Promise<{code: number,  message: string }> {

      try{
          const decode = await this.decodeJwt(accessToken);
          const email = decode.payload.email;
          const currentPassword = body.currentPassword;
          const newPassword = body.newPassword;
          const uuid = body.uuid;
          const userDetails = await this.getAccessToken('user', email, currentPassword);
          if (userDetails.data.code == 200) {
              const clientToken = await this.getAccessToken('client');
              const result = await this.resetPassword(uuid, newPassword, clientToken.data.data);
              return result;
          }
          else {
              return  {
                  code: 401,
                  message: 'Invalid UserId or password'
              }
          }
      }

      catch (err) {
            throw new HttpException(err.message ||  'Failed to change password',err.status ||  HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

    */

    async logout(token){
        const result = await this.keycloakService.logout(token);
        return result;
    }

    async forgotPassword(body, role?: string) {
        try {
            //     0. get the client token.
            //     1. use the username to get the user uuid.
            //     2. if user exists then reset the password with new password.

            if (!body.newPassword) {
                return generateResponse(200, CODE.INVALID, MESSAGE.NEW_PASSWORD_REQUIRED);
            }
            if(!body.userName) {
                return generateResponse(200, CODE.INVALID, MESSAGE.USERNAME_REQUIRED);
            }
            const clientToken = await this.keycloakService.getAccessToken( 'client' );
            const userDetails = await this.keycloakService.getUserData( body.userName , 'username' , clientToken.data.data );
            if (userDetails?.status == HttpStatus.OK && userDetails.data?.data?.length> 0) {
                const result = await this.keycloakService.resetPassword( userDetails.data.data[0].id , body.newPassword , clientToken.data.data );
                if(result?.status === HttpStatus.OK){
                    return generateResponse(200, CODE.SUCCESS, MESSAGE.PASSWORD_SUCCESS);
                }else{
                    this.wl.log("PASSWORD NOT UPDATED")
                    return generateResponse(200, CODE.INVALID, MESSAGE.INVALID);
                }

            } else {
                return generateResponse(200, CODE.INVALID, MESSAGE.INVALID);
            }
        }
            catch (err) {
            this.wl.error(err?.message)
            return generateResponse(err.status, CODE.ERROR, err.message  );

        }
    }

    async getUserListByOrg(body,req,token){
        try{
            // const userRole = req.user.role;
            const username = body.email;
            // const roles = body.roles;
            const context = body.context;
            const search = body.search;
            if (!username){
                return generateResponse(200, CODE.INVALID, MESSAGE.EMAIL_REQUIRED);
            }

            

            const offset = body?.pagination?.offset || 0;
            const limit = body?.pagination?.limit || 10;
            // const clientToken  = await this.keycloakService.getAccessToken( 'client' );
            // const filterkeys = ["id", "username", "firstName", "lastName"];

            // if(userRole == "DMS Admin")
            // {
            //     const countResult = await this.keycloakService.getUserData('', 'count', clientToken.data.data);
            //     if(countResult.data > 0) {
            //         const userList = await this.keycloakService.getUserData( '' , 'search' , clientToken.data.data, offset, limit );
            //         const result = await this.getSelectedFields( userList.data , filterkeys );
            //         return generateResponse(200, CODE.SUCCESS, result, {count: countResult.data});
            //     }
            //     else{
            //         return generateResponse(200, CODE.ERROR, MESSAGE.INVALID);
            //     }
            // }

            const clientData = await this.keycloakService.getAccessToken('client');
            let availableRoles = await  this.keycloakService.getAvailableRole(clientData.data.data, req.user.role);
            availableRoles = JSON.parse(availableRoles.data.data['AvailableRoles']);
            const rolesOnly = availableRoles.map(item => item.role);
            const url = process.env.AXIOS_URL + '/registry/users/list/get';

            const result:any = await lastValueFrom(this.http.post(url, {username,roles: rolesOnly ,context,search,offset,limit}, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
            }}));

            if (result.data.code == CODE.SUCCESS){
                return generateResponse(200, CODE.SUCCESS, result.data.data, {count: result.data.count});
            }
            
            

        }
        catch(error){
            this.wl.error(error.message);
            return generateResponse(500, CODE.ERROR, error.message);
        }
    }

    async getRoles() {
        try {
            const clientToken = await this.keycloakService.getAccessToken('client');
            /*const result: any = await this.keycloakService.getClientIdByName(clientToken.data.data);
            const clientId = result.data?.data;
            if(!clientId){
                return {
                    status: 200,
                    data: {
                        code: 1000,
                        message: "No Client Found"
                    }
                }
            }*/

            const roles = await this.keycloakService.getAssocRolesForClient(clientToken.data.data);
            if(roles?.status == 200) {
                return generateResponse(200, CODE.SUCCESS, roles.data.data);
            }else {
                return generateResponse(200, CODE.INVALID, MESSAGE.NO_ROLES);
            }


        } catch (err) {
            this.wl.error(err?.message);
            throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async searchUser(token, body){
        try{
            const groupName = body?.orgname;
            const userName = body?.userName;
            if (!groupName){
                return generateResponse(200, CODE.INVALID, MESSAGE.INVALID);

            }
            if(!userName) {
                return generateResponse(200, CODE.INVALID, MESSAGE.USERNAME_REQUIRED);
            }else if(userName == ''){
                return generateResponse(200, CODE.INVALID, MESSAGE.USERNAME_EMPTY);
            }
            const filterkeys = ["id" , "username", "firstName", "lastName"];
            // const decode = await this.keycloakService.decodeJwt(token);
            // const role = decode.resource_access[this.client_id].roles[0];
            const clientToken = await this.keycloakService.getAccessToken( 'client' );
            if(groupName == "dms"){
                const countResult = await this.keycloakService.getUserData(userName, 'count', clientToken.data.data);
               if(countResult.data > 0) {


                   const userList = await this.keycloakService.getUserData( userName , 'search' , clientToken.data.data );
                   const result = await this.getSelectedFields( userList.data , filterkeys );
                   return generateResponse(200, CODE.SUCCESS, result, {count: countResult.data} );
               }
                else{
                    return generateResponse(200, CODE.ERROR, MESSAGE.ERROR);
                }
            }else {

                const response: any = await this.keycloakService.getGroupMember(groupName , clientToken.data.data , 0 , 10000 );
                if (response.code == 2000) {
                    const filterUsers = await this.searchUsers(response.data , userName );
                    const result = await this.getSelectedFields(filterUsers, filterkeys);
                    return generateResponse(200, CODE.SUCCESS, result, {count: result.length})

                } else if (response.code == 4004) {
                    return generateResponse(400, response.code, response.message);
                }
            }
        }
        catch (e) {
            this.wl.error(e.message);
            return  generateResponse(500, CODE.ERROR, e.message);

        }
    }




    buildRegexPattern(searchString) {
        if (searchString.includes('%') || searchString.includes('_')) {
            let pattern = '';
            for (let char of searchString) {
                if (char === '%') {
                    pattern += '.*';
                } else if (char === '_') {
                    pattern += '.';
                } else {
                    if (/[.*+?^${}()|[\]\\]/g.test(char)) {
                        pattern += '\\' + char;
                    } else {
                        pattern += char;
                    }
                }
            }
            return pattern;
        } else {
            let escapedSearch = searchString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return '.*' + escapedSearch + '.*';
        }
    }

    searchUsers(arr, searchString) {
        const pattern = this.buildRegexPattern(searchString);
        const regex = new RegExp(pattern, 'i');
        return arr.filter(user => regex.test(user.username));
    }

    getSelectedFields (arr, selectedKeys ){

        return arr.map( obj => {
            return selectedKeys.reduce( (acc , key) => {
                if (obj.hasOwnProperty( key )) {
                    acc[key] = obj[key];
                }
                return acc;
            } , {} );
        } );
    }

    async updateUserDetails(body,uToken){
        try {
            const clientData = await this.keycloakService.getAccessToken('client');
            const userRespData = await this.keycloakService.getUserData(body.userId, 'uuid', clientData.data.data);
            const userInfo = userRespData.data
            if(body?.fname)
                userInfo.firstName = body.fname;
            if(body?.lname)
                userInfo.lastName = body.lname;
            if(body?.enable)
                userInfo.enabled = body.enable;
            if(body?.access_scope){

                await this.onboardService.assignUpermissions(userInfo.username, body?.access_scope?.banks ||  { allow: [], deny: [] }, body?.access_scope?.branches || { allow: [], deny: [] }, uToken, userInfo.firstName, userInfo.lastName, body.access_scope.role);

            }
            const response: any = await this.keycloakService.updateUserDetails(userInfo, body.userId, clientData.data.data);
            if(response.status == 200) {
                let edata = body?.enable ?
                { "status":[1,1,0],
                 "values":[[body?.userId, "USER_DEACTIVATED", 1]], 
                 "headers":["userId","msg", "status"]} : 
                  { "status":[1,1,0],
                    "values":[[body?.userId, "USER_UPDATED", 1]], 
                    "headers":["userId","msg", "status"]}
                return generateResponse(200, CODE.SUCCESS, edata, {edata});

            }else{
                
                let edata = body?.enable?
                { 
                    "status":[1,0,1], 
                    "values":[[body?.userId, "USER_DEACTIVATION_FAILED", 0]], 
                    "headers":["userId","msg", "status"]} : {
                        "status":[1,0,1], 
                        "values":[[body?.userId, "USER_UPDATION_FAILED", 0]], 
                        "headers":["userId","msg", "status"]
                    }
                return generateResponse(200, CODE.ERROR, edata, {edata});
            }
        } catch (error) {
            let edata = body?.enable?
            { 
                "status":[1,0,1], 
                "values":[[body?.userId, "USER_DEACTIVATION_FAILED", 0]], 
                "headers":["userId","msg", "status"]}:
                { 
                    "status":[1,0,1], 
                    "values":[[body?.userId, "USER_UPDATION_FAILED", 0]], 
                    "headers":["userId","msg", "status"]}
                return generateResponse(400, CODE.ERROR, edata, {edata});
            }

    }
    async getUiRolePermisssions(req) {
        try{
            // if (!body?.role){
            //     return generateResponse(200, CODE.INVALID, MESSAGE.ROLE_REQUIRED);
            // }
            // const role=
            //         {"Bank Admin": Bank_Admin,
            //           "Bank RM": Bank_RM,
            //           "DMS Admin": DMS_Admin
            //         }

            // const selectedRole = role[body.role];
            // if (!selectedRole) {
            //     return generateResponse(200, CODE.ERROR, MESSAGE.INVALID_ROLE);
            // }
            const clientData = await this.keycloakService.getAccessToken('client');
            const availableRoles = await  this.keycloakService.getAvailableRole(clientData.data.data, req.user.role, process.env?.UI_CLIENT_UUID);
            if (availableRoles.status == HttpStatus.OK) {
                return generateResponse(HttpStatus.OK, CODE.SUCCESS, availableRoles.data.data);
            }
            // return generateResponse(200, CODE.SUCCESS, selectedRole);

        }catch(error){
            this.wl.error(error.message);
            return generateResponse(400, CODE.ERROR, error.message  );

        }
    }

    async firebaseConfig(){
        try{
            if(process.env?.FIREBASE_CONFIG) {
                return generateResponse(200, CODE.SUCCESS, JSON.parse(process.env.FIREBASE_CONFIG));
            }
            else {
                return generateResponse(400, CODE.ERROR, MESSAGE.NO_DATA);
            }
        }
        catch (e){
                this.wl.error(e);
                return generateResponse(400, CODE.ERROR, e.message);
           }
    }

    getUserAvailableRoles =  async(req, context) => {
        try{
            const clientData = await this.keycloakService.getAccessToken('client');
            const availableRoles = await  this.keycloakService.getAvailableRole(clientData.data.data, req.user.role);
            if (availableRoles.status == HttpStatus.OK) {
                if(context && context == 'role') {
                return generateResponse(HttpStatus.OK, CODE.SUCCESS, JSON.parse(availableRoles.data.data['AvailableRoles']));
                }else if(context && context == 'dtype') {
                    return generateResponse(HttpStatus.OK, CODE.SUCCESS, JSON.parse(availableRoles.data.data['AvailableDtypes']));
                }
            }


        }catch (e) {
            this.wl.error(e);
            return generateResponse(400, CODE.ERROR, e.message);
        }
    }

   

}


