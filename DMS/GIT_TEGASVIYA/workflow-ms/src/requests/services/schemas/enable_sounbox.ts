export const enable_soundbox={
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["ENABLE_SOUNDBOX"]
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
            "row_id": {
              "type": "integer",
              "shouldNotBeEmpty": true
            },
            "rcontext": {
              "type": "string",
              "shouldNotBeEmpty": true
            },
            "dname": {
                "type": "string",
                "shouldNotBeEmpty": true
            },
              "imei": {
                "type": "string",
                "shouldNotBeEmpty": true
            },
            "device_id":{
                "type": "integer",
                "shouldNotBeEmpty": true                
            },
            "sbe":{
                "type": "boolean"           
            }
          },
          "required": ["dname", "rcontext","imei","device_id","sbe"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  };