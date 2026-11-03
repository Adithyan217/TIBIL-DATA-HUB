export const pair_device = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["PAIR_DEVICE"],
        
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
            "identifier": {
              "type": "string",
              "shouldNotBeEmpty": true
            },
            "std": {
              "type": "string",
              "shouldNotBeEmpty": true
            }
          },
          "required": ["row_id","identifier", "std"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
