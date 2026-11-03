export enum commonEnum {
    SUCCESS_CODE = 2000,
    FAILURE_CODE= 4000,
    SUCCESS_MESSAGE= "ENTITY CREATED SUCCESSFULLY",
    NO_RECORDS = "NO RECORDS",
    FAILURE_MESSAGE= "INVALID REQUEST",
    ERROR_CODE = 5000,
    INVALID_CODE= 1000
}
export enum MESSAGE {
    SUCCESS = "SUCCESSFULLY USER CREATED",
    ERROR = "USER IS NOT CREATED",
    INVALID = "INVALID REQUEST",
    SOUNDBOX_ENABLED = "ENABLED SOUNDBOX",



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

