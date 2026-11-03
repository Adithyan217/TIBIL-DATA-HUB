import { Injectable } from "@nestjs/common";

@Injectable()
export class queryService {
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

  async createWfaLog() {
    const query =
      "INSERT INTO workflow.wfalog(aid,eid,astatus,wfstart) VALUES ($1,$2,$3,$4) RETURNING lid";
    return query;
  }

  async updateWfaLog() {
    const query =
      "UPDATE workflow.wfalog SET astatus = $1 , wfend = $2 WHERE lid = $3";
    return query;
  }

  async getHandlers() {
    const query = "SELECT sid, hinfo from workflow.wfhsteps where ecode  = $1";
    return query;
  }

  async createStepLog() {
    const query = `INSERT INTO workflow.wfhlog(sid,aid,eid,hstatus,wfstart) 
        VALUES ($1,$2,$3,$4,$5) RETURNING lid`;
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
    const queryStr = `SELECT h.eid, s.ecode, h.hstatus, h.wfstart, h.wfend, h.hdetails FROM workflow.wfhlog AS h
        JOIN workflow.wfsteps as s ON s.hid = h.hid
        where eid = $1`;
    return queryStr;
  }

  async getHandlerStatusQuery() {
    const query = `SELECT hstatus, hdetails
                FROM workflow.wfhlog
                WHERE aid = $1 AND eid = $2 `;
    return query;
  }
  async getEventLogsQuery(count, data) {
    let whereClause = '';
    let values: (string | number)[] = [];
    const { date, action_type ,request_id} = data.filter;

    const selectClause = count 
        ? `COUNT(el.eid)` 
        : `el.eid, al.aid, el.ecode, el.eby, al.astatus AS action_status, 
           al.wfstart AS started_at, hl.hstatus AS handler_status`;

    let query = `SELECT ${selectClause} 
                 FROM workflow.wfevtslog AS el
                 INNER JOIN workflow.wfalog AS al ON el.eid = al.eid
                 LEFT JOIN workflow.wfhlog hl ON hl.eid = el.eid AND hl.aid = al.aid
                 LEFT JOIN workflow.wfactions AS ac ON ac.aid = al.aid`;

    if (Array.isArray(date) && date.length === 2) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += `el.eat::date BETWEEN $${values.length + 1} AND $${values.length + 2}`;
      values.push(date[0], date[1]); 
    }


    if (action_type) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += `ac.vcode = ANY($${values.length + 1}) `;
      values.push(action_type); 
    }

    if (request_id) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += `el.eid = $${values.length + 1}`;
      values.push(request_id); 
    }

    query += whereClause;

    if (!count) {
        query += ` ORDER BY el.eid DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
        values.push(data.pagination.limit, data.pagination.offset);
    }
    return { query, values };
}


  async getActionType(){
    let whereClause = '';

    const selectClause = `vcode`;
    
    let query = `SELECT ${selectClause} 
                 FROM workflow.wfactions`;

    whereClause += ` WHERE isvisible = TRUE AND isd = FALSE `;


    query += whereClause;

    return { query};

  }

}
