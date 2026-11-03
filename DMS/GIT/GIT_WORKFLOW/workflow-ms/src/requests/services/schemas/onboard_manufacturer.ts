export const onboard_manufacturer = {
  "type": "object",
  "properties": {
      "event": {
          "type": "string",
          "enum": ["ONBOARD_MANUFACTURER"],
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
            "mfname": {
              "type": "string",
              "shouldNotBeEmpty": true
            },
            "mfaddr": {
              "type": "string",
              "shouldNotBeEmpty": true
            },
            "mfinfo": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string",
                  "shouldNotBeEmpty": true
                },
                "phno": {
                  "type": "string",
                  "pattern": "^\\+\\d{12}$",
                  "shouldNotBeEmpty": true
                },
                "email": {
                  "type": "string",
                  "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                  "shouldNotBeEmpty": true
                }
              },
              "required": ["name", "phno", "email"]
            }
          },
          "required": ["row_id","mfname", "mfaddr", "mfinfo"]
        }
      }
  },
  "required": ["event", "event_by", "edetails"]
};
