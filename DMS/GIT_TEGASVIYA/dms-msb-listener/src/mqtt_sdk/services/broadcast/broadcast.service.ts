import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable } from '@nestjs/common';
import { resolve } from 'path';
import { concatMap, filter, from, lastValueFrom } from 'rxjs';
import { CODE } from '../enums/mqtt-msg.enum';

@Injectable()
export class BroadcastService {
    constructor(private http: HttpService) {
        // Initialization logic if needed
    }

    async getAccessToken() {
    try {
        let token = process.env["MSB-GUEST-TOKEN"];
        const username  =  process.env["MSB-SYS-USER"];
        const password =  process.env["MSB-SYS-PWD"];
          const url = process.env["AXIOS-URL"]  + '/user/session';
          const result  = await lastValueFrom(this.http.post(url, {username, password}, {
            headers: {
                Authorization: `Bearer ${token}`,
            }
          })
    
          )
          if(result?.status === HttpStatus.OK) {
            token = result?.data?.data?.access_token;
            return token
    
          }else{
            throw new Error(`Error getting access token`);

          }  
    } catch (error) {
        throw new Error(`Error getting access token: ${error.message}`);
    }
    
    }

    async broadcastMessage(rrn: string, money: string, imei: string) {
        try {
          const token = await this.getAccessToken();
      
          if(!token) {
            console.error('Failed to retrieve access token');
            return;
          }
          const rows = await this.getRows(imei, token);
      
          if (rows.length < 1) {
            console.log('No rows found for the given imei');
            return;
          }
      
          // Loop through the rows and send notifications
          for (const row of rows) {
            await this.sendNotification(row.identifier, money, token);
          }
          
        } catch (error) {
          console.error('Error during broadcasting message:', error);
        }
      }
      
      // Function to get rows based on imei
      async getRows(imei: string, token: string) {
        const url = process.env["AXIOS-URL"] + '/registry/sb/pd/get';
        let sbInfo  = {
            "filter": {
                imei
            }
        }
        try {
          const response = await lastValueFrom (this.http.post(url, sbInfo, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }));
          
          const rows = response.data?.data as [{ identifier: string }];
          return rows || [];
        } catch (error) {
          console.error('Error fetching rows:', error);
          return [];
        }
      }
      
      // Function to send notification for each row
      async sendNotification(identifier: string, money: string, token: string) {
        try {
            console.log(`Sending notification for identifier: ${identifier.substring(3)}`);
          const notifBody = {
            identifier: identifier?.substring(3),  // to remove +91
            context: "fcm",
            payload: {
              title: "Payment Notification",
              body: `Received payment of Rs ${money}`,
              data: {
                amount: `${money}`,
              },
            },
          };
          const getFcmToken = process.env["AXIOS-URL"] + '/user/notification';
          
         const result =  await lastValueFrom(this.http.post(getFcmToken, notifBody , {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }));
          if(result?.status == HttpStatus.OK && result?.data?.code === CODE.SUCCESS) {
          console.log(`Notification sent for identifier: ${identifier}`);
          }
          else{
            console.log(`Unable to send notification for: ${identifier}`);
          }
        } catch (error) {
          console.error(`Error sending notification for identifier ${identifier}:`, error);
        }
      }
      

      async addIntoBlog(rrn: string, money: string, imei: string) {
        try {
          if (typeof rrn === 'string' && rrn.startsWith('Simulate')) {
            return;
        }
            const token = await this.getAccessToken();
            const url = process.env["AXIOS-URL"] + '/dlistener/blog';
            const body = {
                rrn,
                money,
                imei
            };
            const response = await lastValueFrom(this.http.post(url, body, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            }));
    
            if (response.status === HttpStatus.OK && response.data?.code === CODE.SUCCESS) {
                console.log('Successfully added into blog:', response.data);
                return response.data;
            } else {
                console.log('Failed to add into blog:', response.data);
            }
        } catch (error) {
            throw new Error(`Error adding into blog: ${error.message}`);
        }
      }
    
    
}
