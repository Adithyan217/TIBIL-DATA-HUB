export const allocate_to_bank = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["ALLOCATE_TO_BANK"]
        
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
            "device_id": {
              "type": "string"
              
            },
            "bank_id": {
              "type": "string"
              
            }
          },
          "required": ["row_id","device_id", "bank_id"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
