import { Injectable } from '@nestjs/common';
import { query } from 'express';

@Injectable()
export class QueryService {
    constructor(){}

    public async getMetricQuery(context: string,role,userName) {
       const mainQuery = {
        banks: {
            query: `SELECT mname,mvalue FROM intel.bank_metrics($1);`,
            values: [userName]
        },
        devices:{
            query: `SELECT mname,mvalue FROM intel.device_metrics($1,$2);`,
            values: [userName,role]
        },
        payments:{
            query: `SELECT mname,mvalue FROM intel.payment_metrics($1);`,
            values: [userName]
        },
        drequest:{
            query:`SELECT mname,mvalue FROM intel.device_request_metrics($1);`,
            values: [userName]
        },
        issues:{
            query:`SELECT mname,mvalue FROM intel.device_issues_metrics($1);`,
            values: [userName]
        }
       }
       return mainQuery[context];
    }


    async upermissions(body) {
        const { username, banks, branches,fname,lname,urole,enabled = false } = body;

        const allowBanks = banks?.allow || [];
        const denyBanks = banks?.deny || [];
    
        const allowBranches = branches?.allow || [];
        const denyBranches = branches?.deny || [];
    
        const query = `
            SELECT * 
            FROM intel.add_user_permissions($1, $2, $3, $4, $5, $6, $7, $8, $9);
        `;
        const values = [
            username,allowBanks, denyBanks,
            allowBranches, denyBranches,
            fname, lname,urole,enabled
        ];
        return { query, values };
    }

   
}
