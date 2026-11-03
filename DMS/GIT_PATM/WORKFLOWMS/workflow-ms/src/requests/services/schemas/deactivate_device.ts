export const deactivate_device = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["DEACTIVATE_DEVICE"],
        
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
            }
          },
          "required": ["row_id","device_id"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
