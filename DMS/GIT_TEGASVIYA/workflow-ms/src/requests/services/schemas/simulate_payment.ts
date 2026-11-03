export const simulate_payment = {
    "type": "object",
    "properties": {
        "event": {
            "type": "string",
            "enum": ["SIMULATE_PAYMENT"],
            "shouldNotBeEmpty": true
        },
        "event_by": {
            "type": "string",
            "shouldNotBeEmpty": true
        },
        "edetails": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "properties": {
                    "device_id": {
                        "type": "integer",
                        "shouldNotBeEmpty": true   
                    },
                    "txt_amt":{
                        "type": "integer",
                        "shouldNotBeEmpty": true
                    }
                },
                "required": ["device_id", "txt_amt"]
            }
        }
    },  
    "required": ["event", "event_by", "edetails"]
}