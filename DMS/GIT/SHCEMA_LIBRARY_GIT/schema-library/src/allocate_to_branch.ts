export const allocate_to_branch = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["ALLOCATE_TO_BRANCH"],
        
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
            "branch_id": {
              "type": "string"
              
            }
          },
          "required": ["row_id","device_id", "branch_id"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
