
export const device_request = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["DEVICE_REQUEST"],
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
            "bank_name": {
              "type": "string",
              "shouldNotBeEmpty": true
            },
            "bank_id": {
              "type": "integer",
              "shouldNotBeEmpty": true
            },
            "branch_name": {
              "type": "string",
              "shouldNotBeEmpty": true
            },
            "merchant_name": {
                "type": "string",
                "shouldNotBeEmpty": true
            },
            "sim_provider": {
                "type": "string",
                "shouldNotBeEmpty": true
            },
            "device_quantity": {
              "type": "integer",
              "shouldNotBeEmpty": true
            },
            "status": {
              "type": "string",
              "shouldNotBeEmpty": true,
              "enum": ["Open"]
            }
          },
          "required": ["row_id","context", "bank_id","bank_name", "branch_name", "merchant_name","sim_provider","device_quantity","status" ]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
