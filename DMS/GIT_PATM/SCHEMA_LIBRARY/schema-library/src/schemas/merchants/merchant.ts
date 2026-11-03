export const onboard_merchant =
{
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["ONBOARD_MERCHANT"]
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
            "branch_id": {
              "type": "integer"
            },
            "mname": {
              "type": "string"
            },
            "minfo": {
              "type": "object",
              "properties": {
                "accName": {
                  "type": "string"
                },
                "accHolderName": {
                  "type": "string"
                },
                "addr": {
                  "type": "string"
                },
                "phno": {
                  "type": "string",
                  "pattern": "^\\+\\d{12}$"
                }
              },
              "required": ["accName", "accHolderName", "phno"]
            }
          },
          "required": ["bank_id", "branch_id", "mname", "minfo"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }

export default onboard_merchant;