import { Inject, Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

interface AuthMiddlewareOptions {
  publicKey: string;
  keycloakUrl: string;
  realm: string;
  clientId: string;
  clientSecret: string;
  clientUuid: string;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject('AUTH_MIDDLEWARE_OPTIONS') private readonly options: AuthMiddlewareOptions
  ) {}

  async use(req: any, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Bearer token required' });
    }

    const { publicKey, clientId } = this.options;

    try {
      const token = authHeader.split(' ')[1];
      const publicKeys: string = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;

      const decoded: any = jwt.verify(token, publicKeys, { algorithms: ['RS256'] });

      // Cache the client token
      let clientToken: any = await this.cacheManager.get('client_access_token');
      if (!clientToken) {
        clientToken = await this.clientLogin();
        const decodedToken: any = jwt.decode(clientToken);
        const ttl = (decodedToken.exp - Math.floor(Date.now() / 1000)) * 1000;
        

        await this.cacheManager.set('client_access_token', clientToken, ttl );
      }

      // Cache client role attributes
      const role = decoded.resource_access[clientId]?.roles?.[0];
      const clientRoleName = `${clientId+role}`;
      let clientAttributes: any = await this.cacheManager.get(clientRoleName);
      if (!clientAttributes) {
        clientAttributes = await this.getClientRoleAttributes(role, clientToken);
        clientAttributes = JSON.stringify(clientAttributes.attributes);
        await this.cacheManager.set(clientRoleName, clientAttributes, 0);
      }

      // Check route access
      clientAttributes = JSON.parse(clientAttributes);

      if (!clientAttributes[req.originalUrl]) {

        return res.status(403).json({ message: 'Access denied for this route' });
      }
      else {
        const  apiPermission = JSON.parse(clientAttributes[req.originalUrl]);
        if (apiPermission?.params === "true")
        {
          const event = req?.body?.event;
          const url = req?.originalUrl + `?action=${event}`;
          if (!clientAttributes[url]){
            return res.status(403).json({ message: 'Access denied for event' });
          }
        }
      }


      // Cache interface details
      /*const userName = decoded.preferred_username;
      let userAttributes: any = await this.cacheManager.get(userName);
      if (!userAttributes) {
        userAttributes = await this.getUserDetails(userName, clientToken);
        userAttributes = JSON.stringify(userAttributes.attributes);
        await this.cacheManager.set(userName, userAttributes, 0);
      }

      // Attach attributes to request
      userAttributes = JSON.parse(userAttributes);*/
      req['user'] = {
        role: role,
        userName:decoded.preferred_username
      };

      // req['attributes'] = {
      //   client: clientAttributes[req.originalUrl],
      //   // user: userAttributes,
      // };

      return next();
    } catch (error:any) {
    //   console.error('AuthMiddleware error:', error);
      return res.status(500).json({ message: error.message });
    }
  }

  private async clientLogin() {
    const { keycloakUrl, realm, clientId, clientSecret } = this.options;

    try {
      const response = await axios.post(
        `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      return response.data.access_token;
    } catch (error:any) {
      throw new Error(`Failed to obtain client token: ${error.response?.data?.error_description || error.message}`);
    }
  }

  private async getUserDetails(username: string, token: string) {
    const { keycloakUrl, realm } = this.options;

    try {
      const response = await axios.get(
        `${keycloakUrl}/admin/realms/${realm}/users?username=${username}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data[0];
    } catch (error:any) {
      throw new Error(`Failed to fetch user details: ${error.response?.data?.error_description || error.message}`);
    }
  }

  private async getClientRoleAttributes(role: string, token: string) {
    const { keycloakUrl, realm, clientUuid } = this.options;

    try {
      const response = await axios.get(
        `${keycloakUrl}/admin/realms/${realm}/clients/${clientUuid}/roles/${role}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error:any) {
      throw new Error(`Failed to fetch client role attributes: ${error.response?.data?.error_description || error.message}`);
    }
  }
}
