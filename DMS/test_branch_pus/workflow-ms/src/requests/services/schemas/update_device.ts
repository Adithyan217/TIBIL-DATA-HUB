export const update_device = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["UPDATE_DEVICE"],
        "shouldNotBeEmpty": true
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
              "type": "integer"
            },
            "firmware_id": {
              "type": "string"
            },
            "lang": {
              "type": "string"
            },
            "sbe":{
              "type": "boolean"
            }
          },
          "required": ["row_id", "device_id"] 
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  };
  