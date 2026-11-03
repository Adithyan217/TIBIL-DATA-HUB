
export enum paymentStatus {
    RECEIVED = "RECEIVED",
    TRANSFORMED = "TRANSFORMED",
    TRANSFORM_FAILED = "TRANSFORM_FAILED",
    SENT_REQUEST_TO_SWITCH = "SENT_REQUEST_TO_SWITCH",
    SUCCESS_RESPONSE_FROM_SWITCH= "SUCCESS_RESPONSE_FROM_SWITCH",
    FAILURE_RESPONSE_FROM_SWITCH= "FAILURE_RESPONSE_FROM_SWITCH"

}

export enum paymentsMessage {
    SUCCESS_MESSAGE= "Message published",
    SUCCESS_CODE = 200,
    FAILURE_MESSAGE = "Failed to publish a message",
    FAILURE_CODE = 100,
    FAIL_LOG_MSG = "Could not fetch log"
}

export enum notifierType{
    MQTT = "mqtt",
    HTTPS = "https"
}

export enum context{
    transaction = "txn",
    language = "lang",
    settings = "settings",
    commands = "cmd",
    metrics = "metrics",
    ack = "ack",
    transaction_ack = "transaction_ack",
    otp_ack = "otp_ack"
}
