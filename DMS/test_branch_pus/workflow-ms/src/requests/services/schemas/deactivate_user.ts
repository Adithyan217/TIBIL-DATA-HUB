export const deactivate_user = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["DEACTIVATE_USER"]
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
                "userId":{
                    "type": "string",
                    "shouldNotBeEmpty": true
                },
                "enable":{
                    "type":"string",
                    "shouldNotBeEmpty": true,
                    "enum": ["false"]
                }
              },
              "required": ["enable", "userId"]
            },

          }
        },      
    "required": ["event", "event_by", "edetails"]
  };
  