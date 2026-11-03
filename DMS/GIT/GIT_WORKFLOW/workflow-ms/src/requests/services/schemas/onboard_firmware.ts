export const onboard_firmware = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["ONBOARD_FIRMWARE"],
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
            "mfid": {
              "type": "string"
            },
            "fname": {
              "type": "string",
              "shouldNotBeEmpty": true
            }
          },
          "required": ["row_id","mfid", "fname"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }

