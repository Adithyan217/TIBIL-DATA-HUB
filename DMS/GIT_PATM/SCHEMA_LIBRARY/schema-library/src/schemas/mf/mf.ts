const onboard_manufacturer = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["ONBOARD_MANUFACTURER"]
      },
      "event_by": {
        "type": "integer"
      },
      "edetails": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
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
          "required": ["mfname", "mfaddr", "mfinfo"]
        }
      }
    },
    "required": ["event", "event_by", "edetails"]
  }
export default onboard_manufacturer;

