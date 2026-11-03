
export const onboard_branch = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["ONBOARD_BRANCH"]
      },
      "event_by": {
        "type": "integer"
      },
      "edetails": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "bank_id": {
              "type": "integer"
            },
            "branch_name": {
              "type": "string"
            },
            "braddr": {
              "type": "string"
            },
            "brinfo": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "designation": {
                  "type": "string"
                },
                "phno": {
                  "type": "string",
                  "pattern": "^\\+\\d{12}$"
                },
                "email": {
                  "type": "string",
                  "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"

                }
              },
              "required": ["name", "designation", "phno", "email"]
            }
          },
          "required": ["bank_id", "branch_name", "braddr", "brinfo"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
export default onboard_branch;