export const deactivate_bank = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["DEACTIVATE_BANK"],
        
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
              "type": "string",
              "shouldNotBeEmpty": true
            }
          },
          "required": ["row_id","bank_id"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
