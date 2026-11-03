
export const request_for_device = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["REQUEST_FOR_DEVICE"],
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
            "context": {
                "type": "string",
                "shouldNotBeEmpty": true
            },
            "bank": {
              "type": "string",
              "shouldNotBeEmpty": true
            },
            "branch": {
              "type": "string",
              "shouldNotBeEmpty": true
            },
            "merchant": {
                "type": "string",
                "shouldNotBeEmpty": true
            },
            "minfo": {
              "type": "object",
              "properties": {
                "accNo": {
                  "type": "string",
                  "shouldNotBeEmpty": true
                },
                "accHolderName": {
                  "type": "string",
                  "shouldNotBeEmpty": true
                },
                "phno": {
                  "type": "string",
                  "pattern": "^\\+\\d{12}$",
                  "shouldNotBeEmpty": true
                }
              },
              "required": [ "accNo", "accHolderName", "phno" ]
            }
          },
          "required": [ "context", "bank", "branch", "merchant", "minfo" ]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
