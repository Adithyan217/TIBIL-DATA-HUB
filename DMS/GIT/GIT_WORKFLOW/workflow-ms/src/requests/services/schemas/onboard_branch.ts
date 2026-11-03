
export const onboard_branch = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["ONBOARD_BRANCH"],
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
            "branch_code": {
              "type": "integer"
            },
            "bank_id": {
              "type": "string",
              "shouldNotBeEmpty": true
            },
            "branch_name": {
              "type": "string",
              "shouldNotBeEmpty": true
            },
            "brinfo": {
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
              "required": ["name", "phno", "email"]
            }
          },
          "required": ["row_id","bank_id", "branch_name","brinfo"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
