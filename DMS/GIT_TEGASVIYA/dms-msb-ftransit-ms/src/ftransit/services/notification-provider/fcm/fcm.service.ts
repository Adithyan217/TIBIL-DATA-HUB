import * as admin from 'firebase-admin';
import * as path from 'path';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FcmService {
  constructor() {
    // Get the project root directory
    const serviceAccount = {
      type: process.env["FIREBASE-TYPE"],
      project_id: process.env["FIREBASE-PROJECT-ID"],
      private_key_id: process.env["FIREBASE-PRIVATE-KEY-ID"],
      private_key: process.env["FIREBASE-PRIVATE-KEY"]?.replace(/\\n/g, '\n'),
      client_email: process.env["FIREBASE-CLIENT-EMAIL"],
      client_id: process.env["FIREBASE-CLIENT-ID"],
      auth_uri: process.env["FIREBASE-AUTH-URI"],
      token_uri: process.env["FIREBASE-TOKEN-URI"],
      auth_provider_x509_cert_url: process.env["FIREBASE-AUTH-PROVIDER-X509-CERT-URL"],
      client_x509_cert_url: process.env["FIREBASE-CLIENT-X509-CERT-URL"],
      universe_domain: process.env["FIREBASE-UNIVERSE-DOMAIN"],
    } as admin.ServiceAccount;    

    console.log('Firebase client_email:', process.env["FIREBASE-CLIENT-EMAIL"]);

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
