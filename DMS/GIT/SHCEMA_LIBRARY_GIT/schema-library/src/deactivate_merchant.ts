export const deactivate_merchant = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["DEACTIVATE_MERCHANT"]
        
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
              "type": "string"
              
            }
          },
          "required": ["row_id","merchant_id"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
