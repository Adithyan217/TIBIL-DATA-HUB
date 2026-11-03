export const onboard_device = {
  "type": "object",
  "properties": {
    "event": {
      "type": "string",
      "enum": ["ONBOARD_DEVICE"]
      
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
          "model_id": {
            "type": "string"
          },
          "firmware_id": {
            "type": "string"
          },
          "dname": {
            "type": "string"
            
          },
          "imei": {
            "type": "string"
          }
        },
        "required": ["row_id","mfid", "model_id", "firmware_id", "dname","imei"] 
      }
    }
  },
  "required": ["event", "event_by", "edetails"]
};
