export const update_merchant =
{
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["UPDATE_MERCHANT"],
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
            "merchant_id": {
              "type": "integer"
            },
            "mname": {
              "type": "string",
            },
            "maddr": {
              "type": "string",
            },
            "minfo": {
              "type": "object",
              "properties": {
                "accNo": {
                  "type": "integer",
                  "shouldNotBeEmpty": true
                },
                "accHolderName": {
                  "type": "string",
                  "shouldNotBeEmpty": true
                },
                "addr": {
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
          "required": ["row_id"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }

