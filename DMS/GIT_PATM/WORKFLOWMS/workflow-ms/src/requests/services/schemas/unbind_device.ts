export const unbind_device = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["UNBIND_DEVICE"],
        
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
            "vpa_id": {
              "type": "string",
              "shouldNotBeEmpty": true
            }
          },
          "required": ["row_id","device_id", "vpa_id"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
