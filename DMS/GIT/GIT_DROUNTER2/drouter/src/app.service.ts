import { Injectable } from '@nestjs/common';
import { RcacheService } from './dms/services/rcache/rcache.service';
import { DcacheService } from './dms/services/dcache/dcache.service';
import {WorkerService} from "./dms/services/worker/worker.service";

@Injectable()
export class AppService {

  constructor( private rcacheSerice: RcacheService,
    private dcacheService:DcacheService,
    private workerService: WorkerService
  ){
    this.bootStrapCache()
    
  }
  getHello(): string {
    console.log("Inside service")
    return 'Hello World!';
  }
 async bootStrapCache(){

  try {
    await this.rcacheSerice.resetCache()
    await this.dcacheService.resetCache()
    const rcachedata = await this.rcacheSerice.getRouteConfig();
    await this.rcacheSerice.addRouteConfigIntoRCache(rcachedata);
    if(!rcachedata){
      throw new Error("Could not GET cache Config")
    }
  } catch (error) {
    console.error(error?.message || "Error Ocurred");
    console.error("Could not load cache. Exiting application...");
    process.exit(1); 
  }
  
 }

}
