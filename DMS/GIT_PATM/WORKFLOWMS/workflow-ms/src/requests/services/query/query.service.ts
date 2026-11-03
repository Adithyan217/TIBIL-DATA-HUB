import { Injectable } from "@nestjs/common";
import { LoadSecretsService } from "src/load-secrets/load-secrets.service";
import { rolesAccess } from "src/requests/config/roles-access";

@Injectable()
export class queryService {

  constructor(private ls: LoadSecretsService) {}

  async isChainableQuery() {
    const query = `SELECT 1 FROM workflow.echain WHERE pecode = $1 `;
    return query;
  }

  async getChainableEvents(){
    const query = `SELECT cecode,ptype FROM workflow.echain WHERE pecode = $1 ORDER BY eorder`;
    return query;
  }
  async addReq() {
    const query =
      "INSERT INTO workflow.wfevtslog(eby, einfo, ecode, estatus) VALUES ($1,$2,$3,$4) RETURNING eid";
    return query;
  }

  async checkForNewEvent() {
    const query =
      "SELECT eid, ecode, einfo, estatus from workflow.wfevtslog WHERE eid = $1 AND estatus = $2";
    return query;
  }

  async getActionsForEvent() {
    const query =
      "SELECT aid, ainfo, ecode, htype  from workflow.wfactions where ecode = $1 and isd = $2";
    return query;
  }

  async updateEvent() {
    const query = "UPDATE workflow.wfevtslog SET estatus = $1 where eid = $2";
    return query;
  }

  async createWfaLog(peid: number | null) {
      const query =
      "INSERT INTO workflow.wfalog(aid,eid,astatus,wfstart,peid) VALUES ($1,$2,$3,$4,$5) RETURNING lid";
      return query
    
   
  }

  async updateWfaLog() {
    const query = `
    WITH action_meta AS (
      SELECT 
        a.ischainable, 
        ec.final_status
      FROM workflow.wfactions a
      LEFT JOIN workflow.echain ec ON ec.cecode = a.ecode
      WHERE a.aid = $3
    ),
    status_counts AS (
      SELECT 
        COUNT(*) FILTER (WHERE hstatus = 'PROCESSED') AS processed_count,
        COUNT(*) FILTER (WHERE hstatus = 'FAILURE') AS failure_count,
        COUNT(*) FILTER (WHERE hstatus = 'PROCESSING') AS processing_count,
        COUNT(*) AS total_count
      FROM workflow.wfhlog
      WHERE eid = $1
    ),
    final_status AS (
      SELECT 
        CASE 
          WHEN action_meta.ischainable THEN
            CASE 
              WHEN status_counts.processed_count = status_counts.total_count THEN 'PROCESSING'
              WHEN status_counts.failure_count > 0 THEN 'FAILURE'
              ELSE 'PROCESSING'
            END
          ELSE
            CASE 
              WHEN status_counts.processed_count = status_counts.total_count THEN 'PROCESSED'
              WHEN status_counts.failure_count > 0 THEN 'FAILURE'
              WHEN status_counts.processing_count > 0 THEN 'PROCESSING'
              ELSE 'PROCESSING'
            END
        END AS status
      FROM action_meta, status_counts
    ),
    update_current AS (
      UPDATE workflow.wfalog
      SET astatus = final_status.status::workflow.alogstatus
      FROM final_status
      WHERE lid = $2
      RETURNING peid
    ),
    latest_status AS (
      SELECT hstatus
      FROM workflow.wfhlog
      WHERE eid = $1
      LIMIT 1
    )
    UPDATE workflow.wfalog
    SET astatus = 
      CASE 
        WHEN latest_status.hstatus = 'PROCESSED' THEN 'PROCESSED'::workflow.alogstatus
        ELSE 'PROCESSING'::workflow.alogstatus
      END
    FROM action_meta, latest_status, update_current
    WHERE update_current.peid IS NOT NULL
      AND action_meta.final_status
      AND eid = update_current.peid;
  `;
  
    return query;
  }
  

  async updateWfalogForNoHandlerFound(){
    const query = "UPDATE workflow.wfalog SET astatus = $1 WHERE lid = $2 RETURNING lid";
    return query
  }

  async getHandlers() {
    const query = "SELECT sid, hinfo from workflow.wfhsteps where ecode  = $1";
    return query;
  }

  async createStepLog() {
    const query = `INSERT INTO workflow.wfhlog(sid,sname,aid,eid,hstatus,wfstart) 
        VALUES ($1,$2,$3,$4,$5, $6) RETURNING lid`;
    return query;
  }

  async updateStepLog(failStatus: boolean = false) {
    let queryStr = "UPDATE workflow.wfhlog SET hstatus = $1 , wfend = $2";
    if (failStatus) {
      queryStr = queryStr + ", hdetails =  $3:: jsonb WHERE lid = $4";
    } else {
      queryStr = queryStr + " WHERE lid = $3";
    }
    return queryStr;
  }

  async getActionLog() {
    const queryStr =
      "SELECT aid, status, wfstart, wfend FROM workflow.wfalog where eid = $1";
    return queryStr;
  }

  async getHandlerLog() {
    const queryStr = `SELECT h.eid, s.ecode, h.hstatus, h.wfstart, h.wfend, h.hdetails, h.sname FROM workflow.wfhlog AS h
        JOIN workflow.wfsteps as s ON s.hid = h.hid
        where eid = $1`;
    return queryStr;
  }

  async getHandlerStatusQuery() {
    const query = `SELECT hstatus, hdetails, sname
                FROM workflow.wfhlog
                WHERE aid = $1 AND eid = $2`;
    return query;
  }
  async getEventLogsQuery(count, data) {
    let values: (string[] | number)[] = [];
    let userId = data.userId;
    let query;
    const { date, action_type ,request_id} = data?.filter;
    // if(count){
    //   query = count && data?.role === "Bank Admin" || data?.role === "Bank RM" ? rolesAccess[`${data?.role}`].getEvtsCount : rolesAccess[`${data?.role}`].getEvtsCount;
    // }else{
    //   query = data?.role === "Bank Admin" || data?.role === "Bank RM" ? rolesAccess[`${data?.role}`].getEvts : rolesAccess[`${data?.role}`].getEvts;
      
    // }

    if (count) {
      query = rolesAccess[data?.role]?.getEvtsCount;
    } else {
      query = rolesAccess[data?.role]?.getEvts;
    }


    // if(data?.role === 'DMS Admin'){
    //   values.push(userId);
    //   values.push(["Device Request", "Device Issue"]);
    // }

    if(data?.role === 'Bank Admin'){
      values.push(["Device Request", "Device Issue", "Sim Request"]);
      values.push(data.userName);
      values.push(userId);
    }

    if(data?.role === 'CO Bank Admin'){
      values.push(["Device Issue", "Sim Request"]);
      values.push(data.userName);
      values.push(userId);
    }

    if(data?.role === 'Bank RM' || data?.role === 'CO Bank RM'){
      values.push(userId);
    }

    if (Array.isArray(date) && date.length === 2) {
      query += ` AND el.eat::date BETWEEN $${values.length + 1} AND $${values.length + 2}`;
      values.push(date[0], date[1]); 
    }


    if (action_type) {
      query += ` AND ac.vcode = ANY($${values.length + 1})`;
      values.push(action_type); 
    }

    if (request_id) {
      query += ` AND el.eid = $${values.length + 1}`;
      values.push(request_id); 
    }
    if (!count) {
        query += ` ORDER BY el.eid DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
        values.push(data.pagination.limit, data.pagination.offset);
    }
    return { query, values };
    
}


  async getActionType(role: string){
    let values: any = [];
    if(role === 'Bank Admin' || role === 'Bank RM' || role === 'CO Bank Admin' || role === 'CO Bank RM'){
      values.push(JSON.parse(this.ls.secrets[`${role}`]));
    }
    let query = rolesAccess[`${role}`].getActionTypes;
    return { query, values};

  }

  async eventHistory(){
    const query = `SELECT el.ecode,al.astatus,al.peid,el.eid,el.eat,el.eby,(el.einfo->'edetails'->0->>'status') AS cstatus FROM
                   workflow.wfalog al 
                   JOIN workflow.wfevtslog el ON al.eid = el.eid
				           JOIN workflow.wfhlog hl ON hl.eid = el.eid
                   WHERE al.peid = $1`;
    return query;
  }

  async upermissions() {
    const query = 'SELECT * FROM workflow.add_user_permissions($1,$2,$3,$4,$5,$6,$7)';
    return query
}


}
