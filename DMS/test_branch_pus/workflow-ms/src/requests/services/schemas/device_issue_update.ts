export const device_issue_update = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["DEVICE_ISSUE_UPDATE"],
         "shouldNotBeEmpty": true
      },
      "event_by": {
        "type": "string",
        "shouldNotBeEmpty": true
      },
      "peid": {
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
            "iid": {
              "type": "integer",
              "shouldNotBeEmpty": true
            },
            "status": {
                "type": "string",
                "shouldNotBeEmpty": true,
                "enum": ["Resolved","Invalid-Closed"]
            }
          },
            "required": ["row_id","context", "iid", "status" ]
        }
      }
    },
    "required": ["event", "event_by", "edetails", "peid"]
}

