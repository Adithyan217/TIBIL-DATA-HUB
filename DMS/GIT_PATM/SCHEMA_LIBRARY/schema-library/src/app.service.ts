import { Injectable } from '@nestjs/common';
import Ajv from "ajv";

const ajv = new Ajv()
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  ajvValidator(schema, inputData) {
    const isValid = ajv.validate(schema, inputData);
    if (isValid) {
        return {message:inputData};
    } else {
        return {
            errors: ajv.errors
        };
    }
}
}
