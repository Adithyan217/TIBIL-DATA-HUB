export const deactivate_merchant = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["DEACTIVATE_MERCHANT"],
        
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
            "merchant_id": {
              "type": "string",
              "shouldNotBeEmpty": true
            }
          },
          "required": ["row_id","merchant_id"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
