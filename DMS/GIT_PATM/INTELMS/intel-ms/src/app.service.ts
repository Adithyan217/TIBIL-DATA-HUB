import { Inject, Injectable } from '@nestjs/common';
import { Pool } from "pg";
import { iEvent } from './interface/iEvent';

@Injectable()
export class AppService {

  constructor(){}
  getHello(): string {
    return 'Hello World!';
  }

   async triggerAggregateFunctions(functionList:[]){
    /*
    1. Loop the array of functionList
    2. Dynamically call the function
    3. 
    */
   }
}
