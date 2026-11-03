const onboard_device_model = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["ONBOARD_DEVICE_MODEL"]
      },
      "event_by": {
        "type": "integer"
      },
      "edetails": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "mfid": {
              "type": "integer"
            },
            "firmware_id": {
              "type": "integer"
            },
            "model_name": {
              "type": "string"
            }
          },
          "required": ["mfid", "firmware_id", "model_name"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
export default onboard_device_model;