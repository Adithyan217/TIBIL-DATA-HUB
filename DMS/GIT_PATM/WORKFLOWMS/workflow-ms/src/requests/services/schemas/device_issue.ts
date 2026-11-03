export const device_issue = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["DEVICE_ISSUE"],
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
                "shouldNotBeEmpty": true,
                "enum": ["CREATE"]
            },
            "device": {
              "type": "string",
              "shouldNotBeEmpty": true
            },
            "vpa": {
              "type": "string"
            },
            "bank_name": {
              "type": "string",
              "shouldNotBeEmpty": true
            },
            "bank_id": {
              "type": "integer",
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
            "mphno": {
              "type": "string",
              "pattern": "^\\+\\d{12}$",
              "shouldNotBeEmpty": true
            },
            "issue": {
                "type": "string",
                "shouldNotBeEmpty": true
            },
            "status": {
                "type": "string",
                "shouldNotBeEmpty": true,
                "enum": ["Open"]
            }
          },
            "required": ["row_id","context", "device", "bank_id","bank_name", "branch", "merchant", "mphno", "issue", "status" ]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
}
