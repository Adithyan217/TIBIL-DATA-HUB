export const onboard_bank = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["ONBOARD_BANK"],
        
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
            "bank_name": {
              "type": "string",
              "shouldNotBeEmpty": true
            },
            "baddr": {
              "type": "string",
              "shouldNotBeEmpty": true
            },
            "binfo": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string",
                  "shouldNotBeEmpty": true
                },
                "phno": {
                  "type": "string",
                  "pattern": "^\\+\\d{12}$",
                  "shouldNotBeEmpty": true
                },
                "email": {
                  "type": "string",
                  "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                  "shouldNotBeEmpty": true

                }
              },
              "required": ["name","phno", "email"]
            }
          },
          "required": ["row_id","bank_name", "baddr", "binfo"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
