export const allocate_to_branch = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["ALLOCATE_TO_BRANCH"],
        
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
            "device_id": {
              "type": "string",
              "shouldNotBeEmpty": true
            },
            "branch_id": {
              "type": "string",
              "shouldNotBeEmpty": true
            }
          },
          "required": ["row_id","device_id", "branch_id"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
