export enum user_permissions {
  SUCCESS_CODE = 200,
  FAILURE_CODE = 400,
  SUCCESS_MESSAGE = "SUCCESSFULLY ADDED USER PERMISSIONS",
  FAILURE_MESSAGE = "UNABLE TO ADD USER PERMISSIONS",
  NO_RECORDS = "NO RECORDS",
  ERROR_CODE = 500,
  
}

export const message = {
    SUCCESS: {
        DATA_CREATED: {
          code: 200,
          message: 'Onboarded Bank Successfully.'
        },
      },
      ERROR: {
        SERVER_ERROR: {
          code: 500,
          message: 'An error occurred during the creation.'
        },
      }
    };

export enum MESSAGE {
    SUCCESS = "REQUEST ADDED SUCCESSFULLY",
    ERROR = "REQUEST FAILED",
    INVALID_SCHEMA = "INVALID SCHEMA",
    FAILURE_TO_ADD_PERMISSION = "UNABLE TO ADD USER PERMISSIONS"



}

export enum CODE {
    SUCCESS = 2000,
    ERROR = 4000,
    INVALID = 1000
}

// Mapping of CODE to response field names
export const RESPONSE_FIELDS = {
    [CODE.SUCCESS]: 'data',
    [CODE.ERROR]: 'message',
    [CODE.INVALID]: 'message', // This can be adjusted depending on how you want to handle INVALID
}

export const generateResponse = (status, code, option, extras?: Record<string, any>) => {
    // Get the correct response field (either 'data' or 'message')
    const field = RESPONSE_FIELDS[code] || 'message';  // Default to 'message' if the code isn't found in the mapping

    // Create the base response object
    const response: any = {
        status: status,
        data: {
            code: code,
            [field]: option,  // Dynamically assign either 'data' or 'message' based on the code
        },
    };

    // If extras is provided and is an object, add its key-value pairs to the data object
    if (extras && typeof extras === 'object') {
        Object.keys(extras).forEach(key => {
            response.data[key] = extras[key];
        });
    }

    return response;
}

