export const onboard_merchant =
{
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["ONBOARD_MERCHANT"],
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
            "bank_id": {
              "type": "string"
            },
            "branch_id": {
              "type": "string"
            },
            "mname": {
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
              "required": ["accNo", "accHolderName", "phno"]
            }
          },
          "required": ["row_id","bank_id", "branch_id", "mname", "minfo"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }

