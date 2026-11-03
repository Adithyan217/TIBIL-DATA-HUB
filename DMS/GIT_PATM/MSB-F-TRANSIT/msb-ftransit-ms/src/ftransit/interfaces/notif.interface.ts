export interface Fcm {
    identifier: string;
    context: string;
    token: string
    title: string;
    body: string;
    data?: {
        [key: string]: any;
    }
    
}