import { Injectable } from '@nestjs/common';

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
  public async UpdateStatus() {
    return `UPDATE drouter.payments_cache 
            SET updated_at= CURRENT_TIMESTAMP, status=$1
            WHERE pid = $2`
  }

  public async insertIntoPLog(){
    const query = `
    INSERT INTO drouter.plog (pid, lmsg)
    VALUES ($1, $2)
    RETURNING lid;
  `;
  return query;
}
  

}
