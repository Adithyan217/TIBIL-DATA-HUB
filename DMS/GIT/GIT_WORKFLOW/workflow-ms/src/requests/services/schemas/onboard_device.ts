export const onboard_device = {
  "type": "object",
  "properties": {
    "event": {
      "type": "string",
      "enum": ["ONBOARD_DEVICE"],
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
          "onboard_status": {
            "type": "string",
            "shouldNotBeEmpty": true
          },
          "mf_id": {
            "type": "string"
          },
          "model_id": {
            "type": "string"
          },
          "firmware_id": {
            "type": "string"
          },
          "dname": {
            "type": "string",
            "shouldNotBeEmpty": true
          },
          "imei": {
            "type": "string"
          },
          "vpa_id": {
            "type": "string"
          },
          "bank_id": {
            "type": "string"
          },
          "branch_id": {
            "type": "string"  
          },
          "merchant_id": {
            "type": "string"
          },
        },
        "required": ["row_id","onboard_status","mf_id", "model_id", "firmware_id", "dname","imei"] 
      }
    }
  },
  "required": ["event", "event_by", "edetails"]
};
