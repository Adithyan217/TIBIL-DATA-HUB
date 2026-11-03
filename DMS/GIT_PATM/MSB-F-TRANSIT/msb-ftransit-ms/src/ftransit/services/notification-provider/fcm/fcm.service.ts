import * as admin from 'firebase-admin';
import * as path from 'path';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FcmService {
  constructor() {
    // Get the project root directory
    const projectRoot = process.cwd();
    const configPath = path.join(projectRoot, 'src', 'certificates', 'sb-dms-firebase.json');
    const serviceAccount = require(configPath)
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      console.log('Firebase app already initialized');
    }
  }


async sendPushNotification(
  token: string, 
  title: string, 
  body: string, 
  data?: { [key: string]: string }
): Promise<any> {
  const message = {
    token,
    notification: {
      title,
      body,
    },
    data, // Optional custom data for client-side use
  };

  try {
    const response = await admin.messaging().send(message);   
    if(response){
      return { success: true, response };
    }else{
    return { success: false, msg: "failed" };

    }    
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }
}

}
