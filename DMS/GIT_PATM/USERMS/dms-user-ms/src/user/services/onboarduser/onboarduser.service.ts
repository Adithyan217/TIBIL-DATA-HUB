import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { UserService } from '../user.service';
import {KeycloakService} from '../keycloak/keycloak.service'
import {WinstonLoggerService} from "../winstonlogger/winstonlogger.service";
import {generateResponse, CODE, MESSAGE } from '../../enum/user.enum';
@Injectable()
export class OnboarduserService {
public  defaultPassword: string;

    constructor(public http: HttpService,
                public configService: ConfigService,
                private keycloakService: KeycloakService, protected wl:WinstonLoggerService) {
       // this.defaultPassword = this.configService.get<string>('DEFAULT_PASSWORD', '');
        this.defaultPassword = "Welcome@99"
    }

    public async onboardUser(body: any, token: string, role: string) {
        try {
            let userDetails = body?.edetails[0];
            const clientToken: any = await this.keycloakService.getAccessToken('client');
            const isuserExists:any = await this.keycloakService.getUserData(userDetails?.user_info?.username, 'username', clientToken.data.data)
            this.wl.log(isuserExists)
            if(isuserExists.data?.length > 0) {
                let edata = {
                    headers: ['username', 'msg', 'status'],
                    values: [[userDetails?.user_info?.email, 'USER_EXISTS',0]],
                    status: [1,0,1]
                }
                return  {  code: CODE.SUCCESS, edata: edata, message: MESSAGE.USER_EXISTS}
            }
            let banks: { allow: string[]; deny: string[] } = { allow: [], deny: [] };
            let branches: { allow: string[]; deny: string[] } = { allow: [], deny: [] };
            
            if(userDetails?.user_access?.length > 0) {
            userDetails.user_access.forEach(access => {
                if (access.banks) {
                    if (Array.isArray(access.banks.allow)) {
                        banks.allow.push(...access.banks.allow);
                    }
                    if (Array.isArray(access.banks.deny)) {
                        banks.deny.push(...access.banks.deny);
                    }
                }
            
                if (access.branches) {
                    if (Array.isArray(access.branches.allow)) {
                        branches.allow.push(...access.branches.allow);
                    }
                    if (Array.isArray(access.branches.deny)) {
                        branches.deny.push(...access.branches.deny);
                    }
                }
            });
        }
            


            let userBody = {
                username: userDetails?.user_info?.username,
                email: userDetails?.user_info?.email,
                enabled: true,
                firstName: userDetails?.user_info?.fname,
                lastName: userDetails?.user_info?.lname,
                emailVerified: true,
                requiredActions: role === 'MSB Guest' ? []: ["UPDATE_PASSWORD"],
                credentials: [
                    {
                        type: 'password',
                        value: this.defaultPassword,
                        temporary: role === 'MSB Guest' ? false: true, // Temporary password for MSB Guest
                    },
                ],
                
            }
            const response:any  = await this.keycloakService.createUser(userBody, clientToken.data.data);
            this.wl.log(response.status)
            if(response.status === 201) {
                let userData: any = await this.keycloakService.getUserData(userDetails?.user_info?.username, 'username', clientToken?.data?.data );
                userData = userData?.data?.data[0];
                this.wl.log(JSON.stringify(userData))
                let edata = {
                    headers: ['username', 'msg', 'status'],
                    values: [[userDetails?.user_info?.email, 'USER_ONBOARDED', 1]],
                    status: [1,1,0]
                }
                this.assignClientRole(clientToken?.data?.data, userDetails.user_role,userData);
                if(role !== 'MSB Guest') {
                this.assignUpermissions(userBody?.email,banks, branches,token,userBody.firstName,userBody.lastName,userDetails.user_role);
                }
                return {code: CODE.SUCCESS, edata: edata, message: MESSAGE.SUCCESS}
            }
        }catch (error) {
            this.wl.log(error)
            let edata = {
                headers: ['username', 'msg', 'status'],
                values: [[body?.edetails[0]?.user_info?.email, 'USER_ONBOARDING_FAILED', 0]],
                status: [1,0,1]
            }
            return {code: CODE.ERROR, edata: edata, message: MESSAGE.ERROR}
        }
       
    }
    async assignClientRole(clientToken: string, role: string, userDetails) {
        try{

            const rolesResponse = await  this.keycloakService.getClientRoles(userDetails.id, role, clientToken);
            if(rolesResponse.status == 200 || rolesResponse.status == 201) {
                const roles = rolesResponse.data;
                for(let el of roles){
                    const payload = [

                        {
                            id: el.id,
                            name: el.role

                        }];

                    const assignRole = await this.keycloakService.assignRole(userDetails.id, el.clientId, clientToken, payload);
                }
            }
        }
        catch (error) {
            this.wl.log(error);
        }
    }


    async assignGroup(user_access:any, clientToken, userUuid ){

        const getGroup = async (group, token, useruuid) => {
            const result = await this.keycloakService.getGroup(group, token);
            if (result.code == 2000)
                await this.keycloakService.assignUserToGroup(useruuid, result.id, token);
        }

        try{
            for(let el of user_access){
                await getGroup(el.banks, clientToken, userUuid);
                /*if (el.branches.length > 0 ){
                    el.branches.forEach(async (branch) => {
                       await getGroup(branch, clientToken, userUuid);
                    })
                }
                else{
                    await getGroup(el.banks, clientToken, userUuid);

                }*/
            }
           
        }
        catch (error) {
            this.wl.log(error);
        }

    }

    async assignUpermissions(username,banks, branches, token,fname,lname,urole) {
        try {
            const url = process.env.AXIOS_URL + '/registry/user-permission';
            const body = {username, banks, branches,fname,lname,urole}
            const result    = await lastValueFrom(this.http.post(url, body, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
            }}));
            if(result.status === 200 || result.status === 201) {
                try{
                    const registryresult = result.data;
                    const wfurl = process.env.AXIOS_URL + '/requests/user-permission';
                    const wfresult    = await lastValueFrom(this.http.post(wfurl, registryresult, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                    }}));
                }
                catch (error) {
                    this.wl.error("The error is:::", error);
                }
            const iurl = process.env.AXIOS_URL + '/intel/user-permission';
            const iresult    = await lastValueFrom(this.http.post(iurl, {username,banks, branches,fname,lname,urole}, {
            headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
            }}));
                this.wl.log("User permissions assigned successfully")
            }
        } catch (error) {
            this.wl.error("The error is:::", error);
        }
    }   
}