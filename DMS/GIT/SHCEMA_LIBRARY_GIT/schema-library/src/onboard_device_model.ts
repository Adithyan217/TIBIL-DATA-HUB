export const onboard_device_model = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["ONBOARD_DEVICE_MODEL"]
         
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
            "mfid": {
              "type": "string"
            },
            "firmware_id": {
              "type": "string"
            },
            "model_name": {
              "type": "string"
              
            }
          },
          "required": ["row_id","mfid", "firmware_id", "model_name"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }