export const intel_event = {
  type: "object",
  properties: {
    event: {
      type: "string",
      enum: [
        "ONBOARD_BANK_PROCESSED",
        "ONBOARD_BRANCH_PROCESSED",
        "ONBOARD_MERCHANT_PROCESSED",
        "DEVICE_ISSUE_PROCESSED",
        "DEVICE_ISSUE_UPDATE_PROCESSED",
        "ONBOARD_DEVICE_PROCESSED",
        "ONBOARD_DEVICE_ALLOCATE_TO_BANK_PROCESSED",
        "ONBOARD_DEVICE_ALLOCATE_TO_MERCHANT_PROCESSED",
        "ONBOARD_DEVICE_ONBOARD_DEVICE_PROCESSED",
        "ALLOCATE_TO_BANK_PROCESSED",
        "ALLOCATE_TO_BRANCH_PROCESSED",
        "ALLOCATE_TO_MERCHANT_PROCESSED",
        "DEVICE_REQUEST_PROCESSED",
        "DEVICE_REQUEST_DELIVERED_PROCESSED",
        "PAYMENT_PROCESSED",
        "DEACTIVATE_DEVICE_PROCESSED",
        "ONBOARD_DEVICE_ALLOCATE_TO_BRANCH_PROCESSED"
      ]
      
      
    },
    event_by: {
      type: "string",
      minLength: 1
    },
    rdetails: {
      type: "object",
      properties: {
        status: {
          type: "array",
          items: { type: "integer" }
        },
        values: {
          type: "array",
          items: {
            type: "array",
            items: true // allows any type inside the sub-array
          }
        },
        headers: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["status", "values", "headers"]
    }
  },
  required: ["event", "event_by", "rdetails"]
};
