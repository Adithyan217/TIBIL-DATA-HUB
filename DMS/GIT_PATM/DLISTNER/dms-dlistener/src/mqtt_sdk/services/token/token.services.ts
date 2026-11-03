import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TokenService {
  constructor(private http: HttpService) {}

  async getToken(): Promise<string> {
    const url = `${process.env.AXIOS_URL}/user/session`;
    const payload = {
      username: process.env.SYSUSER_NAME,
      password: process.env.SYSUSER_PASS,
    };

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SYSUSER_TOKEN}`,
    };

    try {
      const response = await firstValueFrom(this.http.post(url, payload, { headers }));

      if (response.status === 200) {
        const token = (response.data as any)?.data?.access_token;
        return token;
      } else {
        throw new Error(`Unexpected response: ${response.status} ${JSON.stringify(response.data)}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to fetch token: ${error.message}`);
    }
  }
}
