export class Wrequest {
  event: string;
  event_by: string;
  details: Record<string, string | number>[];
}

export class Revent {
  eid: number;
  eby: string;
  einfo: {
    event: string;
    event_by: string;
    peid?: number;
    edetails?:object[];
    rdetails?:object[];
  };
  ecode: string;
  status: string;
}

export class Hprops {
  aid: number;
  htype: string;
  ainfo: { endpoint: string };
  ecode: string;
}
export class Hinfo {
  aid: number;
  alid: number;
  eid: number;
  ecode: string;
  eby:string;
  edetails?:object[];
  rdetails?:object[];
}
