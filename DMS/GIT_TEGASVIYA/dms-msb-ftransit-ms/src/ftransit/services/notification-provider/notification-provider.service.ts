import { Injectable } from '@nestjs/common';
import { Fcm } from 'src/ftransit/interfaces/notif.interface';
import { FcmService } from './fcm/fcm.service';
import { CODE, fmsgs, generateResponse } from '../enum/common_messages.enum';

@Injectable()
export class NotificationProviderService {
    constructor(private fcm: FcmService) {}

    // This method is used to identify the type of notification and route it accordingly currently only supports FCM
    async identifyNotificationRoute(notificationBody: Fcm): Promise<any> {
        try {
            let {title, body, data} = notificationBody;
            const result  = await this.fcm.sendPushNotification(notificationBody?.token, title, body, data);
            if(result?.success) {
                return generateResponse(200, CODE.SUCCESS, fmsgs.FIREBASE_NOTIF_SUCCESS_MSG);  
            }else{
                return generateResponse(200, CODE.INVALID, fmsgs.FIREBASE_NOTIF_FAILURE_MSG);
            }
        } catch (error) {
            console.error(error)
            return generateResponse(400, CODE.ERROR, fmsgs.COMMON_ERROR_MSG);

        }
    }
}
