export const update_user = {
  type: "object",
  properties: {
    event: {
      type: "string",
      enum: [
        "UPDATE_USER",
        "UPDATE_MSB_USER"
      ]
    },
    event_by: {
      type: "string",
      shouldNotBeEmpty: true
    },
    edetails: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            shouldNotBeEmpty: true
          },
          notification: {
            type: "string",
            enum: ["true", "false"], // Allow only "true" or "false" as strings
            shouldNotBeEmpty: true
          },
          language: {
            type: "string",
            shouldNotBeEmpty: true,
            enum: ["Hindi - हिन्दी", "English", "Kannada - ಕನ್ನಡ"]
          },
          fname: {
            type: "string",
            shouldNotBeEmpty: true
          },
          lname: {
            type: "string",
            shouldNotBeEmpty: true
          },
          access_scope: {
            type: "object",
            properties: {
              role: {
                type: "string",
                shouldNotBeEmpty: true
              },
              banks: {
                type: "object",
                properties: {
                  allow: {
                    type: "array",
                    items: {
                      type: "string",
                      shouldNotBeEmpty: true
                    }
                  },
                  deny: {
                    type: "array",
                    items: {
                      type: "string",
                      shouldNotBeEmpty: true
                    }
                  }
                },
                required: ["allow", "deny"]
              },
              branches: {
                type: "object",
                properties: {
                  allow: {
                    type: "array",
                    items: {
                      type: "string",
                      shouldNotBeEmpty: true
                    }
                  },
                  deny: {
                    type: "array",
                    items: {
                      type: "string",
                      shouldNotBeEmpty: true
                    }
                  }
                },
                required: ["allow", "deny"]
              }
            },
            required: ["role", "banks", "branches"]
          }
        },
        required: ["userId"],
        allOf: [
          {
            if: {
              properties: {
                event: { const: "UPDATE_MSB_USER" }
              },
              required: ["event"]
            },
            then: {
              // Either notification or language is required for MSB User
              anyOf: [
                {
                  required: ["notification"]
                },
                {
                  required: ["language"]
                }
              ],
              not: {
                required: ["fname", "lname", "access_scope"]
              }
            }
          }
        ]
      }
    }
  },
  required: ["event", "event_by", "edetails"]
};
