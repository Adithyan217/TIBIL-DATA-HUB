
export const update_branch = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["UPDATE_BRANCH"],
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
            "branch_id": {
              "type": "integer",
              "shouldNotBeEmpty": true
            },
            "braddr": {
              "type": "string",
            },
            "brinfo": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string",
                  "shouldNotBeEmpty": true
                },
                "designation": {
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
          "required": ["row_id","branch_id"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
