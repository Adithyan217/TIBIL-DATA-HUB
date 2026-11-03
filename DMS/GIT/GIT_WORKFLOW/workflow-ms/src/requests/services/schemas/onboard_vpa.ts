export const onboard_vpa = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["ONBOARD_VPA"],
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
            "row_id":{
              "type": "integer"
            },
            "vpa": {
              "type": "string",
              "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+$",
               "shouldNotBeEmpty": true
            },
            "device_id": {
              "type": "string",
              "shouldNotBeEmpty": true
            },
            "bank_id":{
              "type": "string",
              "shouldNotBeEmpty": true
            }
          },
          "required": ["row_id","vpa","device_id" ,"bank_id"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"],
    "additionalProperties": false
  }
