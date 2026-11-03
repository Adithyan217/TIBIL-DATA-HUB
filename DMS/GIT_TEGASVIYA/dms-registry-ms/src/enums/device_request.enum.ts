export enum deviceRequestMessage{
    SUCCESS_MESSAGE= "Request Creation Successful",
    SUCCESS_CODE = 200,
    FAILURE_MESSAGE = "Unable to process creation",
    FAILURE_CODE = 400,
    LOW_QUANTITY_MESSAGE = "Unable to process creation, total quantity is less than 10",
    
}

export enum GeneralErrors {
    SERVER_ERROR_MESSAGE = "Internal server error",
    SERVER_ERROR_CODE = 500,
  }