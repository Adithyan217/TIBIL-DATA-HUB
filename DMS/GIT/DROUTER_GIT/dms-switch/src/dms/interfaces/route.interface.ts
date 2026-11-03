export interface RouteConfig {
  iid: number;
  did: number;
  durl: string;
}

export interface IHeader {
 ifsc: any;
 did: any;
 key: any;
 context: any;
}

export interface pnotifBody {
  data: string;
  contextKey: string;
}

export interface logReq {
  request_id: string;
  device_id: string;
  limit: number;
  offset: number;
}
