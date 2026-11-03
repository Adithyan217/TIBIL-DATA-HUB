 const  onboard_device  = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["ONBOARD_DEVICE"]
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
            "model_id": {
              "type": "integer"
            },
            "firmware_id": {
              "type": "integer"
            },
            "dname":{
            "type": "string"
          },
          "required": ["mfid", "model_id", "firmware_id","dname"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
}
export default onboard_device