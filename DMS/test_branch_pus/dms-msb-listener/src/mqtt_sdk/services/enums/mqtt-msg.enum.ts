export enum broker_device_msg {
    RECEIVED_MSG_FROM_BROKER = "RECEIVED_MSG_FROM_BROKER",
    RECEIVED_ACK_FROM_DEVICE = "RECEIVED_ACK_FROM_DEVICE",
    PUSHED_NOTIF_TO_FB = "PUSHED_NOTIF_TO_FB",
} 

export enum CODE {
    SUCCESS = 2000,
    ERROR = 4000,
    INVALID = 1000,
    CREATED = 2001
}

// Mapping of CODE to response field names
export const RESPONSE_FIELDS = {
    [CODE.SUCCESS]: 'data',
    [CODE.CREATED]: 'data',
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


