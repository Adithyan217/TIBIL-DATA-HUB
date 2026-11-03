export const onboard_manufacturer = {
  "type": "object",
  "properties": {
      "event": {
          "type": "string",
          "enum": ["ONBOARD_MANUFACTURER"]
           
      },
      "event_by": {
          "type": "string"
          
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
              "type": "string"
              
            },
            "mfaddr": {
              "type": "string"
              
            },
            "mfinfo": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                  
                },
                "phno": {
                  "type": "string",
                  "pattern": "^\\+\\d{12}$"
                  
                },
                "email": {
                  "type": "string",
                  "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
                  
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
