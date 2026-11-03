import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { User } from '../../interface/user.interface';
import * as jwt from 'jsonwebtoken';
import {WinstonLoggerService} from "../winstonlogger/winstonlogger.service";
import {CODE, generateResponse, MESSAGE } from '../../enum/user.enum';

@Injectable()
export class KeycloakService {
    public readonly axios_url: string;
    public readonly realms: string;
    public readonly client_id: string;
    public readonly client_secret: string;
    public readonly client_uuid:string;
    constructor(public http: HttpService,
                public configService: ConfigService,
                protected wl:WinstonLoggerService ) {
        this.axios_url = this.configService.get<string>('AXIOS_URL', '');
        this.realms = this.configService.get<string>('REALMS', '');
        this.client_id = this.configService.get<string>('CLIENT_ID', '');
        this.client_secret = this.configService.get<string>('CLIENT_SECRETS', '');
        this.client_uuid = this.configService.get<string>('CLIENT_UUID', '');
    }
    public async getAccessToken(context = '', username = '', password = '') {
        try {
            const clientBody: Record<string, string> = {
                grant_type: 'client_credentials',
                client_id: this.client_id,
                client_secret: this.client_secret,
            };
            if (context === 'user') {
                clientBody.username = username;
                clientBody.password = password;
                clientBody.grant_type = 'password';
            }

            const params = new URLSearchParams();
            Object.entries(clientBody).forEach(([key, value]) => params.append(key, value));

            const url = `${this.axios_url}/realms/${this.realms}/protocol/openid-connect/token`;
            const response: any = await lastValueFrom(
                this.http.post(url, params.toString(), {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                })
            );

            return  generateResponse(200, CODE.SUCCESS, context === 'user' ? response.data : response.data.access_token);

        } catch (err) {
            this.wl.error(err?.response?.data?.error_description || err?.message);

            if (err.status == 400 ){
                return generateResponse(200, CODE.INVALID, MESSAGE.RESET_PASSWORD);
            }
            else if (err.status == 401 ) {
                return generateResponse(err.status, CODE.ERROR, err.response.data.error_description);
            }
            return generateResponse(err.status, CODE.ERROR, err.message  );
        }
    }

    public async getUserData(contextValue='', context, clientToken, offset= 0, limit= 10 ){
        try {
            let url = `${this.axios_url}/admin/realms/${this.realms}/users`;

            if(context == 'count') {
                url += `/count`
                if (contextValue !== '')
                    url += `?search=${contextValue}`;
            }
            if(context == 'uuid')
                url+= `/${contextValue}`;
            if(context == 'search'){
                url += `?first=${offset}&max=${limit}&search=${contextValue}`;
            }

            if(context == 'username'){
                url +=  `?username=${contextValue}`;
            }
            const userData: any = await lastValueFrom( this.http.get( url ,{
                headers : {
                    'Authorization' : `Bearer ${clientToken}`,
                    'Content-Type' : 'application/json'
                },
            }));
            if (
                userData?.status === HttpStatus.OK &&
                (
                    (Array.isArray(userData.data) && userData.data.length > 0) || 
                    (context == 'uuid' && typeof userData.data === 'object') || 
                    (context == 'count' && typeof userData.data?.count === 'number')
                )
            ) {
                return generateResponse(200, CODE.SUCCESS, userData.data);
            }
            else {
                return generateResponse(200, CODE.INVALID, MESSAGE.INVALID);
            }
           
        }
        catch (err) {
            this.wl.error(err?.response?.data?.error_description || err?.message);

            return {
                code: 401,
                message: 'Invalid UserId or password'
            }
        }
    }

    async resetPassword(userId: string, newPassword: string, accessToken: string) {
        try {


            const url = `${this.axios_url}/admin/realms/${this.realms}/users/${userId}/reset-password`;

            const body = {
                type: 'password',
                value: newPassword,
                temporary: false, // User won't be forced to change it again
            };

            await lastValueFrom(
                this.http.put(url, body, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            return generateResponse(200, CODE.SUCCESS, MESSAGE.PASSWORD_SUCCESS);

        } catch (err) {
            this.wl.error(err?.response?.data?.error_description || err?.message);

            // console.log(err);
            if (err.status == 400) {
                return generateResponse(200, CODE.ERROR, err.response.data.error_description);
            }
            else {
                return generateResponse(err.status, CODE.ERROR, err.message  );
            }

        }
    }

    async logout(token) {
        try {

            const url = `${this.axios_url}/realms/${this.realms}/protocol/openid-connect/logout`;

            const result = await lastValueFrom(this.http.post(url, {}, {
                headers: {
                    Authorization: `Bearer ${token}`, // Ensure you have an admin token
                    "Content-Type": "application/json"
                }
            }));

            return generateResponse(200, CODE.SUCCESS, MESSAGE.LOGOUT_SUCCESS );

        } catch (error) {
            this.wl.error(error?.response?.data?.error_description || error?.message);
            return generateResponse(error.status, CODE.ERROR,  error.message);
        }
    }



    public async decodeJwt(token ){
        return await jwt.decode(token, { complete: true });
    }

    public async createUser(body: any, clientToken) {
        try {


            const url = `${this.axios_url}/admin/realms/${this.realms}/users`;
            const response = await lastValueFrom(this.http.post(url, body, {
                                                                    headers : {
                                                                        'Authorization' : `Bearer ${clientToken}`,
                                                                        'Content-Type' : 'application/json'
                                                                    },
                                                                }

            ))
            // response format to be updated
            return response
        }catch (error) {
            this.wl.error(error?.response?.data?.error_description || error?.message);
            // response format to be updated
            return {code: CODE.ERROR, message: MESSAGE. ERROR};
        }

    }
    public async getClientRoles(userUuid: string, role: string, token) {

        try{
            const url  = this.axios_url+`/admin/realms/${this.realms}/ui-ext/available-roles/users/${userUuid}?first=0&max=11&search=${role}`
            const response = await lastValueFrom(
                this.http.get(url, {
                    headers: {
                        Authorization: `Bearer ${token}`, // Ensure you have an admin token
                        "Content-Type": "application/json"
                    }
                })
            )
            this.wl.log(`Response for assigning client role is::: ${JSON.stringify(response.status)}`);
            return response;

        }catch (err) {
            this.wl.error(err?.response?.data?.error_description || err?.message);

            return err;
        }

    }

    public async assignRole(userUuid:string, clientUuid, token: string, payload: any ) {
        try{
            const url = `${this.axios_url}/admin/realms/${this.realms}/users/${userUuid}/role-mappings/clients/${clientUuid}`;
            const response = await lastValueFrom(
                this.http.post(url, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`, // Ensure you have an admin token
                        "Content-Type": "application/json"
                    }
                })
            )
            return response;
        }
        catch (err) {
            this.wl.error(err?.response?.data?.error_description || err?.message);

            return err;
        }

    }

    public async getGroup(groupName: any, token: string) {
        try{
            const url = `${this.axios_url}/admin/realms/${this.realms}/groups?search=${groupName}`;
            const response = await lastValueFrom(
                this.http.get(url, {
                    headers: {
                        Authorization: `Bearer ${token}`, // Ensure you have an admin token
                        "Content-Type": "application/json"
                    }
                })
            )
            if(response.status == 200){
              const groupData = response.data[0];
              if(groupName == groupData.name){
                  return { code: CODE.SUCCESS,
                      id :groupData.id}
              }
              else {
                 return {
                     code: CODE.SUCCESS,
                     id: groupData.subGroups[0].id
                 }
              }
            }
            else {
                return {
                    code: CODE.ERROR,
                    message: 'Unable to get group groups.'
                }
            }
        }
        catch (e) {
            this.wl.error(e?.response?.data?.error_description || e?.message);

            return {
                code: CODE.ERROR,
                message: e.message || "Unable to get group groups."
            }
        }

    }
    public async assignUserToGroup(userUuid, groupUuid, token){
        try{
            const url = `${this.axios_url}/admin/realms/${this.realms}/users/${userUuid}/groups/${groupUuid}`;
            const response = await lastValueFrom(
                this.http.put(url, {}, {
                    headers: {
                        Authorization: `Bearer ${token}`, // Ensure you have an admin token
                        "Content-Type": "application/json"
                    }
                })
            )
            return   response;
        }catch (e) {
            this.wl.error(e?.response?.data?.error_description || e?.message);

        }
    }

    // public async getGroupMember(groupName, token, offset= 0, limit= 10 ) {

    //     try {
    //         const group = await this.getGroup( groupName, token );
    //         if (group.code == CODE.SUCCESS) {
    //             // get the total count

    //             const url = `${this.axios_url}/admin/realms/${this.realms}/groups/${group.id}/members?first=${offset}&max=${limit}`;
    //             const response = await lastValueFrom(
    //                 this.http.get( url , {
    //                     headers : {
    //                         Authorization : `Bearer ${token}` , // Ensure you have an admin token
    //                         "Content-Type" : "application/json"
    //                     }
    //                 } ) );
    //                     if (response.status == 200){
    //                        return {
    //                            code: CODE.SUCCESS,
    //                            data: response.data
    //                        }

    //                     }else{
    //                         return {
    //                             code: CODE.SUCCESS,
    //                             data: []
    //                         }
    //                     }

    //         } else {
    //             return {
    //                     code : CODE.ERROR ,
    //                     message : "Organization does not exist"
    //             }
    //         }

    //     } catch (e) {
    //         this.wl.error(e?.response?.data?.error_description || e?.message);

    //         return {

    //                 code : CODE.ERROR ,
    //                 message : e.message

    //         }


    //     }
    // }


    async  getClientIdByName(token: string) {
        try {
            const url = `${this.axios_url}/admin/realms/${this.realms}/clients?first=0&max=11&clientId=${this.client_id}&search=true`;
            const clientData = await lastValueFrom(this.http.get(url, { headers: { Authorization: `Bearer ${token}` } }));
            if (clientData.status == 200) {
                return generateResponse(200, CODE.SUCCESS, clientData.data[0].id)

            } else {
                return generateResponse(400, CODE.ERROR, '')

            }
        } catch (error) {
            this.wl.error(error?.response?.data?.error_description || error?.message);
            return  generateResponse(error.status, CODE.ERROR, error.message);

        }

    }

    async  getAssocRolesForClient(token: string) {
        try {
            const url = `${this.axios_url}/admin/realms/${this.realms}/clients/${this.client_uuid}/roles`;
            const clientData = await lastValueFrom(this.http.get(url, { headers: { Authorization: `Bearer ${token}` } }));
            if (clientData.status == 200) {

                return  generateResponse(200, CODE.SUCCESS,clientData.data.map(el => el.name ));

            } else {
                return generateResponse(400, CODE.ERROR, '');

            }
        } catch (error) {
            this.wl.error(error?.response?.data?.error_description || error?.message);

            return  generateResponse(error.status, CODE.ERROR, error.message);
        }

    }
    async getUserAssociatedClient(userUuid: string, clientToken) {
        try{
            const url = `${this.axios_url}/admin/realms/${this.realms}/users/${userUuid}/role-mappings/clients/${this.client_uuid}`;
            const response = await lastValueFrom(
                this.http.get(url, {
                    headers: {
                        Authorization: `Bearer ${clientToken}`, // Ensure you have an admin token
                        "Content-Type": "application/json"
                    }
                })
            )
            if (response.status == 200) {
                return {
                    code: CODE.SUCCESS,
                    data: response.data
                }
            }

        }catch (e) {
            this.wl.error(e?.response?.data?.error_description || e?.message);

            return{
                code: CODE.ERROR,
                message: e.message
            }
        }
    }
    async getUserAssociatedGroup(userUuid: string, clientToken) {
        try{
            const url = `${this.axios_url}/admin/realms/${this.realms}/users/${userUuid}/groups`;
            const response = await lastValueFrom(
                this.http.get(url, {
                    headers: {
                        Authorization: `Bearer ${clientToken}`, // Ensure you have an admin token
                        "Content-Type": "application/json"
                    }
                })
            )
            if (response.status == 200) {
                return {
                    code: CODE.SUCCESS,
                    data: response.data
                }
            }else{
                return {
                    code: CODE.INVALID,
                    data: []
                }
            }

        }catch (e) {
            this.wl.error(e?.response?.data?.error_description || e?.message);

            return{
                code: CODE.ERROR,
                message: e.message
            }
        }
    }

    async updateUserDetails(body, userId: string, token: string) {
        try {
            const url = `${this.axios_url}/admin/realms/${this.realms}/users/${userId}`;
            const response = await lastValueFrom(
                this.http.put(url, body, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                })
            )
            console.log(response.status);
            if(response.status === 204){
                return generateResponse(200, CODE.SUCCESS, MESSAGE.USER_DETAILS_UPDATED);
            }else{
                return generateResponse(200, CODE.INVALID, MESSAGE.INVALID);
 
            }
        }catch (error) {
            this.wl.error(error?.response?.data?.error_description || error?.message);

            return generateResponse(error.status, CODE.ERROR, MESSAGE.USER_DETAILS_UPDATE_FAILED );

        }
    }

    getAvailableRole = async (token, role, client_uuid= this.client_uuid) => {
        try{
            const url = `${this.axios_url}/admin/realms/${this.realms}/clients/${client_uuid}/roles/${role}`;
            const response = await lastValueFrom(
                this.http.get(url,  {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                })
            )

            if(response.status === 200) {
             return  generateResponse(HttpStatus.OK, CODE.SUCCESS, response.data.attributes);
            }
            return generateResponse(HttpStatus.OK, CODE.SUCCESS, []);

        }
        catch (error) {
            this.wl.error(error?.response?.data?.error_description || error?.message);
            return generateResponse(error.status, CODE.ERROR, error.messsage );
        }
    }

}
