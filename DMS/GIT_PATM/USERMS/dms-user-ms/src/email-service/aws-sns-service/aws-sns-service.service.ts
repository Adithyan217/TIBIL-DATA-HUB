import { Injectable } from '@nestjs/common';
import { SES, SendEmailCommand } from '@aws-sdk/client-ses';
const region:string |any     = 'us-east-1';
@Injectable()
export class AwsSnsServiceService {
    private ses: SES;

    /* constructor() {
        // const accessKey:string |any  = process.env.AWS_KEY;
        // const secretKey:string| any = process.env.AWS_SECRET;
        //
        // this.ses = new SES({ region,
        //                        credentials: {
        //                            accessKey,
        //                            secretKey },  });
    }
    async sendEmail(to: string, subject: string, body: string) {
        const params = {
            Source: 'uat.noreply@pocketatm.in',
            Destination: {
                ToAddresses: [to],
            },
            Message: {
                Subject: {
                    Data: subject,
                },
                Body: {
                    Text: {
                        Data: body,
                    },
                },
            },
        };

        try {
            const data = await this.ses.send(new SendEmailCommand(params));
            return data;
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }
    } */
}


