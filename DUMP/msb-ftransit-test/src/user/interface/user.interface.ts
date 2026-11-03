export interface User {
    username: string;
    password: string;
}

export interface Fcm {
    identifier: string;
    context: string;
    payload: {
        title: string;
        body: string;
        data?: {
            [key: string]: any;
        }
    }
}

export interface deviceDetails{
    dname: string;
    imei: string;
    mfname: string;

}

