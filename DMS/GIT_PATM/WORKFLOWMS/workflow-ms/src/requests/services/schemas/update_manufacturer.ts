export const update_manufacturer = {
  "type": "object",
  "properties": {
      "event": {
          "type": "string",
          "enum": ["UPDATE_MANUFACTURER"],
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
            "mfid": {
                "type": "integer"
            },
            "mfaddr": {
              "type": "string",
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
            },
            "certsno": {
              "type": "integer",
              "shouldNotBeEmpty": true
            }
          },
          "required": ["row_id","mfid"]
        }
      }
  },
  "required": ["event", "event_by", "edetails"]
};
