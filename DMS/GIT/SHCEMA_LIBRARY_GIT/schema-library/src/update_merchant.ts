export const update_merchant =
{
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["UPDATE_MERCHANT"]
         
      },
      "event_by": {
        "type": "string"
        
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
            "minfo": {
              "type": "object",
              "properties": {
                "accNo": {
                  "type": "integer"
                  
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
              "required": ["accNo", "accHolderName", "phno"]
            }
          },
          "required": ["row_id","merchant_id"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }

