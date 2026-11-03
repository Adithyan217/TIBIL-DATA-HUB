import { Injectable } from "@nestjs/common";

@Injectable()
export class queryService {

  constructor() {}
  async addOtpfactor() {
    const query =
      `INSERT INTO users.ufactors(idf, fcontext, expires_at, fval)
      VALUES($1, $2, $3, $4)
      ON CONFLICT (idf, fcontext)
      DO UPDATE SET
        fcontext = EXCLUDED.fcontext,
        expires_at = EXCLUDED.expires_at,
        fval = EXCLUDED.fval
      RETURNING uid;`;
    return query;
  }

  async validateOtpFactor() {
    const query =
      `SELECT uid, fval FROM users.ufactors WHERE idf = $1 AND fcontext = $2 AND fval = $3 AND expires_at > EXTRACT(EPOCH FROM NOW()) LIMIT 1;`;
    return query;
  }

  async addFactorToken(){
    const query =
      `INSERT INTO users.ufactors(idf, fcontext, fval )
      VALUES($1, $2, $3)
      ON CONFLICT (idf, fcontext)
      DO UPDATE SET
        fcontext = EXCLUDED.fcontext,
        fval = EXCLUDED.fval
      RETURNING uid;`;
    return query;
  }

  async getFactorToken() {
    const query =
      `SELECT uid, fval FROM users.ufactors WHERE idf = $1 AND fcontext = $2 ;`;
    return query;
  }

 

  
  

  


}
