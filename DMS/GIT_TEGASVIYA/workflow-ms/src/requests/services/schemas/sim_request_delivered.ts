export const sim_request_delivered = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["SIM_REQUEST_DELIVERED"],
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
            "srid": {
                "type": "integer",
                "shouldNotBeEmpty": true
            },
            "context": {
                "type": "string",
                "shouldNotBeEmpty": true,
                "enum": ["UPDATE"]
            },
            "status": {
                "type": "string",
                "shouldNotBeEmpty": true,
                "enum": ["Delivered"]
            }
          },
          "required": ["row_id", "srid", "context", "status"]}
      }
    },
    "required": ["event", "event_by", "edetails"]
}
