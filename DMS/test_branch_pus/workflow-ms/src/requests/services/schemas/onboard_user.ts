export const onboard_user = {
  type: "object",
  properties: {
    event: {
      type: "string",
      enum: [
        "ONBOARD_USER",
        "ONBOARD_BANK_RM",
        "ONBOARD_BANK_ADMIN",
        "ONBOARD_CO_BANK_RM",
        "ONBOARD_CO_BANK_ADMIN",
        "ONBOARD_MSB"
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
          user_info: {
            type: "object",
            properties: {
              username: {
                type: "string",
                shouldNotBeEmpty: true
              },
              fname: {
                type: "string",
                shouldNotBeEmpty: true
              },
              lname: {
                type: "string",
                shouldNotBeEmpty: true
              },
              email: {
                type: "string",
                pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                shouldNotBeEmpty: true
              },
              user_org: {
                type: "string",
                shouldNotBeEmpty: true
              }
            },
            required: ["username", "fname", "lname", "email", "user_org"]
          },
          user_role: {
            type: "string",
            shouldNotBeEmpty: true
          },
          user_access: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              properties: {
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
              required: ["banks", "branches"]
            }
          }
        },
        required: ["user_info", "user_role"], // user_role is always required
        allOf: [
          {
            if: {
              properties: {
                user_role: { const: "MSB" }
              },
              required: ["user_role"]
            },
            then: {
              // If role is MSB, user_access is not required
              not: {
                required: ["user_access"]
              }
            }
          }
        ]
      }
    }
  },
  required: ["event", "event_by", "edetails"]
};
