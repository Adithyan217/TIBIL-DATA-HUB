
export const device_request_allocated = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["DEVICE_REQUEST_ALLOCATED"],
         "shouldNotBeEmpty": true
      },
      "event_by": {
        "type": "string",
        "shouldNotBeEmpty": true
      },
      "peid":{
        "type": "integer",
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
            "context": {
              "type": "string",
              "shouldNotBeEmpty": true,
              "enum": ["UPDATE"]
            },
            "status":{ 
              "type": "string",
              "shouldNotBeEmpty": true,
              "enum": ["Allocated"]
            },
           "drid": {
              "type": "integer",
              "shouldNotBeEmpty": true
            
           }
          },
          "required": ["row_id","context", "drid", "status" ]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
