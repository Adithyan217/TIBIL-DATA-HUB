export const cwdTopics = [
    {
        "context": "txn",
        "pubTopic": "/sb/cwd/{device_id}/in/transaction",
        "replaceValue": "device_id",
        "subTopic": "/sb/cwd/{device_id}/out/transaction"
    },
    {
        "context": "lang",
        "pubTopic": "/sb/cwd/{device_id}/in/update",
        "replaceValue": "device_id",
        "subTopic": "/sb/cwd/{device_id}/out/update"
    },
    {
        "context": "telemetry",
        "subTopic": "/sb/cwd/{device_id}/out/tele",
        "replaceValue": "device_id"
    }
]
export const walnutTopics= [
    {
        "context": "txn",
        "pubTopic": "soundbox/{device_id}/transaction",
        "replaceValue": "device_id"
    },
    {
        "context": "lang",
        "pubTopic": "soundbox/{device_id}/settings",
        "replaceValue": "device_id"
    },
    {
        "context": "settings",
        "pubTopic": "soundbox/{device_id}/settings",
        "replaceValue": "device_id"
    },
    {
        "context": "cmd",
        "pubTopic": "soundbox/{device_id}/command",
        "replaceValue": "device_id"
    },
    {
        "context":"metrics",
        "subTopic": "soundbox/{device_id}/metrics",
        "replaceValue": "device_id"
    },
    {
        "context":"ack",
        "subTopic": "soundbox/{device_id}/ack",
        "replaceValue": "device_id"
    },
    {
        "context":"transaction_ack",
        "subTopic": "soundbox/{device_id}/transaction_ack",
        "replaceValue": "device_id"
    },
    {
        "context":"otp_ack",
        "subTopic": "soundbox/{device_id}/otp_ack",
        "replaceValue": "device_id" 
    }
 
 
 ]
 