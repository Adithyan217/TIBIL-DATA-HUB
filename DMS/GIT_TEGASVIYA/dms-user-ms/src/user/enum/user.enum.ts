export enum MESSAGE {
    SUCCESS = "SUCCESSFULLY USER CREATED",
    ERROR = "USER IS NOT CREATED",
    INVALID = "INVALID USER",
    PASSWORD_REQUIRED= "PASSWORD REQUIRED",
    USERNAME_REQUIRED= "USERNAME IS REQUIRED",
    RESET_PASSWORD = "RESET PASSWORD",
    LOGOUT_SUCCESS= "USER LOGOUT SUCCESSFULLY",
    USER_DETAILS_UPDATED = "USER DETAILS UPDATED",
    USER_DETAILS_UPDATE_FAILED = "USER DETAILS UPDATES FAILED",
    NEW_PASSWORD_REQUIRED= "NEW PASSWORD REQUIRED",
    PASSWORD_SUCCESS = "PASSWORD SUCCESSFULLY UPDATED",
    EMAIL_REQUIRED = "EMAIL IS REQUIRED",
    NO_ROLES= "NO ROLES",
    USERNAME_EMPTY = "USERNAME CAN'T BE EMPTY",
    ROLE_REQUIRED = "USER ROLE REQUIRED",
    INVALID_ROLE = "INVALID ROLE",
    NO_DATA= "NO DATA",
    USER_EXISTS= "USERS EXISTS",

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

