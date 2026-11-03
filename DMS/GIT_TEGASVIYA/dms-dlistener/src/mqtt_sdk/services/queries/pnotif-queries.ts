import { Injectable } from '@nestjs/common';

@Injectable()
export class listnerQueryService {
  constructor() {}

  public async insertMsgIntoPlog(context: string) {
    const query = context == 'plog'?`
        INSERT INTO registry.plog(rrn,imei, txnAmt,status)
        VALUES ($1, $2, $3, $4)
        RETURNING plid;
      `:`INSERT INTO registry.blog(rrn,imei, txnAmt,status)
      VALUES ($1, $2, $3, $4)
      RETURNING blid;`
    return query;
  }

  public async updateAckStatus() {
    const query = `
        UPDATE registry.plog SET status = $1, ack_status = $2 WHERE rrn = $3 RETURNING plid;
      `;
    return query;
  }

  public async insertMetricsIntoDB() {
    const query = `
       INSERT INTO registry.tlog (imei, tdetails)
        VALUES ($1, $2)
        ON CONFLICT (imei) 
        DO UPDATE SET 
            tdetails = EXCLUDED.tdetails,
            uat = CURRENT_TIMESTAMP
        RETURNING tlid;

      `;
    return query;
  }

  async getIdFromIMEI() {
    const query = `
        select bid,brid FROM registry.sb WHERE did = (select did from registry.devices where imei = $1);
      `;
    return query;
  }
  

}
