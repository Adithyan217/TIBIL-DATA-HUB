import Ajv from "ajv";
const ajv = new Ajv()
export function ajvValidator(schema, inputData) {
    const isValid = ajv.validate(schema, inputData);
    if (isValid) {
        return {message:inputData};
    } else {
        return {
            errors: ajv.errors
        };
    }
}