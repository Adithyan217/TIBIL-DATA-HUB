import { Injectable } from '@nestjs/common';
import { query } from 'express';

@Injectable()
export class pnotifQueryService {
  constructor() {}

  public async insertPaymentRecord() {
    const query = `
        INSERT INTO drouter.payments_cache (iid,did,key,details, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING pid;
      `;
    return query;
  }

  public async validateAndInsertIntoPcache() {
    const query = `
        SELECT imei, dname, is_deactivated, inserted_pid, rcontext FROM drouter.validate_and_insert_into_payments_cache($1, $2, $3, $4, $5);
      `;
    return query;
  }

  public async UpdateStatus(status = 'RECEIVED', pid: number, rrn: string = '', amount: number = 0.00, rtCount:number) {
    if(rrn && amount){
      const query = `UPDATE drouter.payments_cache 
            SET rrn = $1, amount = $2, updated_at = CURRENT_TIMESTAMP, rtcount = $4
            WHERE pid = $3`;
      return {query: query, values: [rrn, amount, pid, rtCount]}
    }else{
      const query =  `UPDATE drouter.payments_cache 
            SET updated_at= CURRENT_TIMESTAMP, status=$1, rtcount = $3
            WHERE pid = $2`;
      return {query: query, values: [status, pid, rtCount]}
    } 
  }

  public async insertIntoPLog(){
    const query = `
    INSERT INTO drouter.plog (pid, lmsg)
    VALUES ($1, $2)
    RETURNING lid;
  `;
  return query;
}

public getRcontext = (dname) => {
    const query = `SELECT rcontext 
                    FROM drouter.soundboxes
                    WHERE dname = $1`;
    return {query: query, values: [dname]};
}

}
