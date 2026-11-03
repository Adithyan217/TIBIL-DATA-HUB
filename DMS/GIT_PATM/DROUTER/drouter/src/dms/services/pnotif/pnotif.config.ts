const cacheData = [{
    "rid": 1,
    "details": {
        "rname": "SWITCH_MQTT_CWD",
        "notifier": "mqtt",
        "dconfig": {
            "notifier": "mqtt",
            "callStack": [
                "initialize",
                "validate",
                "decrypt",
                "transform",
                "encrypt",
                "sendResponse"
            ],
            "drouter_mqtt": {
                "pub": {
                    "url": "/api/v1/device/{device_id}/publish/transaction",
                    "replace": "{device_id}"
                },
                "sub": {
                    "url": "/api/v1/device/{device_id}/subscribe/transaction",
                    "replace": "{device_id}"
                },
                "payload": {
                    "amount": 0,
                    "transaction_id": ""
                },
                "initialization": {
                    "ca_file": "server_ca.crt",
                    "client_certificate": "client_cert.crt",
                    "client_private_key": "client_private.key"
                },
                "payloadReplace": {
                    "amount": "body.transaction_amount",
                    "transaction_id": "body.transaction_id"
                }
            }
        },
        "sconfig": {
            "callStack": [
                "insertIntoCache",
                "decrypt",
                "transform",
                "encrypt",
                "sendResponse"
            ],
            "switch_drouter": {
                "failurePayload": {
                    "statMsg": "Failed to Insert",
                    "reqRefNo": "",
                    "statCode": "F"
                },
                "successPayload": {
                    "statMsg": "Successfully Received",
                    "reqRefNo": "",
                    "statCode": "S"
                },
                "PayloadReplacer": {
                    "statMsg": "data.msg",
                    "reqRefNo": "data.reqRefNo ",
                    "statCode": "data.statCode"
                }
            }
        },
        "security": {
            "iv": "7dzhcnrb0016hmj3",
            "key": "k92ldahavl97s428vxri7x89seoy79sm",
            "algo": "aes-256-gcm",
            "type": "symEncryptor"
        }
    }
}]