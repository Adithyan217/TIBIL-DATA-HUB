export const sim_request = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["SIM_REQUEST"],
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
            "context": {
                "type": "string",
                "shouldNotBeEmpty": true,
                "enum": ["CREATE"]
            },
            "device": {
              "type": "string",
              "shouldNotBeEmpty": true
            },
            "bank_name": {
              "type": "string",
              "shouldNotBeEmpty": true
            },
            "bank_id": {
              "type": "integer",
              "shouldNotBeEmpty": true
            },
            "branch": {
              "type": "string",
              "shouldNotBeEmpty": true
            },
            "merchant": {
                "type": "string",
                "shouldNotBeEmpty": true
            },
            "status": {
                "type": "string",
                "shouldNotBeEmpty": true,
                "enum": ["Open"]
            },
            "current_sp": {
              "type": "string",
              "shouldNotBeEmpty": true
            },
            "requested_sp": {
              "type": "string",
              "shouldNotBeEmpty": true
            }
          },
            "required": ["row_id", "context", "device", "bank_id", "bank_name", "branch", "merchant", "status", "current_sp", "requested_sp"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
}
