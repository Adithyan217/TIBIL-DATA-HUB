export const onboard_vpa = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["ONBOARD_VPA"]
         
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
            "vpa": {
              "type": "string",
              "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+$"
               
            },
            "bank_id":{
              "type": "string"
            }
          },
          "required": ["row_id","vpa", "bank_id"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"],
    "additionalProperties": false
  }
