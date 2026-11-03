export const deactivate_branch = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["DEACTIVATE_BRANCH"]
        
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
            "branch_id": {
              "type": "string"
              
            }
          },
          "required": ["row_id","branch_id"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
