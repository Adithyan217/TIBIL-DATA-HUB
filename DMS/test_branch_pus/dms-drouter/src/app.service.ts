import { Injectable } from '@nestjs/common';


@Injectable()
export class AppService {

  constructor( 

  ){
    
  }
  getHello(): string {
    console.log("Inside service")
    return 'Hello World!';
  }
 
}
