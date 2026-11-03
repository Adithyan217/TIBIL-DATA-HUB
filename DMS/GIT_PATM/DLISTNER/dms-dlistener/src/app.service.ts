import { Injectable } from '@nestjs/common';
import * as process from "node:process";

@Injectable()
export class AppService {
  constructor() {
  // console.log('AppService constructor', process.env.PRIVATE_KEY);
  }
  getHello(): string {
    return 'Hello World!';
  }
}
