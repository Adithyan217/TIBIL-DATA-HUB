export const deactivate_vpa = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["DEACTIVATE_VPA"]
        
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
            "vpa_id": {
              "type": "string"
              
            }
          },
          "required": ["row_id","vpa_id"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
