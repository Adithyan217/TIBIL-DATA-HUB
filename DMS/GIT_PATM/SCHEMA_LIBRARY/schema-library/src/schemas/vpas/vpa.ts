export const onboard_vpa = {
    "type": "object",
    "properties": {
      "event": {
        "type": "string",
        "enum": ["ONBOARD_VPA"]
      },
      "event_by": {
        "type": "integer",
        "minimum": 1
      },
      "edetails": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "vpa": {
              "type": "string",
              "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+$"
            }
          },
          "required": ["vpa"]
        },
        "minItems": 1
      }
    },
    "required": ["event", "event_by", "edetails"],
    "additionalProperties": false
  }
export default onboard_vpa;  