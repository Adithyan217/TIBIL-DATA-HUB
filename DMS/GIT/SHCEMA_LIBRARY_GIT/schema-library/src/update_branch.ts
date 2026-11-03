
export const update_branch = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["UPDATE_BRANCH"]
         
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
            "branch_id": {
              "type": "integer"
              
            },
            "braddr": {
              "type": "string"
              
            },
            "brinfo": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                  
                },
                "designation": {
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
              "required": ["name","phno", "email"]
            }
          },
          "required": ["row_id","branch_id"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
