import { Injectable, BadRequestException } from "@nestjs/common";
import Ajv, { ErrorObject, ValidateFunction } from "ajv";
import { schemaLoader } from "../schema.loader";

@Injectable()
export class SchemaValidationService {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, useDefaults: true });
    this.ajv.addKeyword({
      keyword: 'shouldNotBeEmpty',
      type: ['string', 'number'],
      validate: (schema, data) => {
        if (schema) {
          if (typeof data === 'string') return data.trim() !== '';
          if (typeof data === 'number') return !isNaN(data);
        }
        return false;
      },
      errors: false
    });
  }

  public async ajvValidator(
    schema: any,
    inputData: any,
  ): Promise<{ message?: any; errors?: string[] }> {
    const errors: Set<string> = new Set();

    // Validate the entire input data against the provided schema
    const isValid = this.ajv.validate(schema, inputData);

    // If the entire body is not valid, extract and simplify error messages
    if (!isValid && this.ajv.errors) {
      this.ajv.errors.forEach((error) => {
        const simplifiedMessage = this.simplifyAjvError(error);
        if (simplifiedMessage) {
          errors.add(simplifiedMessage);
        }
      });
    }

    // Validate `edetails` array items if they exist (optional, can be removed if not needed)
    if (Array.isArray(inputData?.edetails)) {
      inputData.edetails.forEach((item, index) => {
        const isItemValid = this.ajv.validate(
          schema?.properties?.edetails?.items,
          item,
        );
        if (!isItemValid && this.ajv.errors) {
          // Extract and simplify error messages for `edetails`
          this.ajv.errors.forEach((error) => {
            const simplifiedMessage = this.simplifyAjvError(error, index);
            if (simplifiedMessage) {
              errors.add(simplifiedMessage);
            }
          });
        }
      });
    }

    if (errors.size > 0) {
      return { message: "Validation Failed", errors: Array.from(errors) };
    } else {
      return { message: inputData };
    }
  }

  private simplifyAjvError(error: ErrorObject, index?: number): string | null {
    if (error.keyword === "required") {
      const missingProperty = error.params?.missingProperty;
      if (index !== undefined) {
        return missingProperty
          ? `Field '${missingProperty}' is required in edetails[${index}].`
          : null;
      }
      return missingProperty
        ? `Field '${missingProperty}' is required.`
        : null;
    }

    if (error.keyword === "type") {
      if (index !== undefined) {
        return `Field '${error.instancePath.slice(1)}' should be of type '${error.params?.type}' in edetails[${index}].`;
      }
      return `Field '${error.instancePath.slice(1)}' should be of type '${error.params?.type}'.`;
    }

    if (error.message) {
      if (index !== undefined) {
        return `Validation error in edetails[${index}]: ${error.message}`;
      }
      return `Validation error: ${error.message}`;
    }

    return null; // Ignore errors that don't match specific conditions
  }

  public async loadSchemaIfPresent(event_name: string) {
    const filePath = await schemaLoader.filter(
      (e) => event_name?.toLocaleLowerCase() === e?.event?.toLocaleLowerCase(),
    );
    if (filePath?.length > 0) {
      return filePath[0]?.eschema;
    }
  }
}
