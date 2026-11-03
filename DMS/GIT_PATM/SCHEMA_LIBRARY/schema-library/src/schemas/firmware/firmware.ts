const onboard_firmware = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["ONBOARD_FIRMWARE"]
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
            "fname": {
              "type": "string"
            }
          },
          "required": ["mfid", "fname"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }

export default onboard_firmware;