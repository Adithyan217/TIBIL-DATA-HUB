export interface response {
    code: number;
    message?: string;
    data?: any;
}
export interface Policy{
    policy_name:string
}


export interface Upermission {
    username: string;
    banks: {
      allow: string[];
      deny: string[];
    };
    branches: {
      allow: string[];
      deny: string[];
    };
    fname: string;
    lname: string;
    urole: string;
  }
  