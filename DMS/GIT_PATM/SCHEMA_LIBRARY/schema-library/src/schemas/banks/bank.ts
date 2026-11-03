const onboard_bank = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["ONBOARD_BANK"]
      },
      "event_by": {
        "type": "integer"
      },
      "edetails": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "bank_name": {
              "type": "string"
            },
            "baddr": {
              "type": "string"
            },
            "binfo": {
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
          "required": ["bank_name", "baddr", "binfo"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
export default onboard_bank
