import { Injectable } from '@nestjs/common';

@Injectable()
export class pnotifQueryService {
  constructor() {}

  // public async getRouteConfig() {
  //   const queryStr = `select durl from switch.insert_and_fetch_durl($1,$2,$3)`;
  //   return queryStr;
  // }

  public async getRouteConfig() {
    const queryStr = `select iid, did, config, notifier from switch.update_and_fetch_durl($1, $2, $3, $4, $5, $6)`;
    return queryStr;
  }

  public async insertPaymentRecord() {
    const query = `
        INSERT INTO switch.mqtt_cache (did,details,rid,status)
        VALUES ($1, $2, $3,$4)
        RETURNING *;
      `;
    return query;
  }
  public async UpdateStatus() {
    return `UPDATE switch.mqtt_cache 
            SET updated_at= CURRENT_TIMESTAMP, status=$1
            WHERE pid = $2`
  }

  public async insertIntoLogs(){
    return `INSERT INTO switch.dlogs(rid, did, response)
    VALUES($1, $2, $3)`
  } 

  public async getReqLogs(){
    return `SELECT l.rid, l.did, m.details As request, l.response FROM 
    switch.dlogs as l JOIN
    switch.mqtt_cache as m
    ON m.rid = l.rid
    WHERE l.rid = $1`;
  }

  public async getTelemetryLogs(){
    return `SELECT lid,rid,did,response FROM switch.dlogs
    WHERE did = $1 
	  ORDER BY lid DESC
	  LIMIT 5 `;
  }
}
