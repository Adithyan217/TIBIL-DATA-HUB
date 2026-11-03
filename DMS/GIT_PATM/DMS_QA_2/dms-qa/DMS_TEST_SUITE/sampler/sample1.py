def extract_values(response_json, keys, context_keys):
    """Extract specified values from a JSON response and map to context keys."""
    values = {}
    key_list = keys.split(",")
    context_key_list = context_keys.split(",")

    for key, context_key in zip(key_list, context_key_list):
        key = key.strip()
        context_key = context_key.strip()
        parts = key.split(".")
        data = response_json

        for part in parts:
            if isinstance(data, dict) and part in data:
                data = data[part]
            elif isinstance(data, list) and part.isdigit():
                data = data[int(part)]
            else:
                data = None
                break

        if data is not None:
            values[context_key] = data
        else:
            print(f"⚠️ Warning: Could not extract {key} from response.")

    print(f"🔍 Extracted Values: {values}")  # Debug print
    return values

test_json = {
    "code": 200,
    "count": "1",
    "data": [
        {
            "eid": 705,
            "aid": 1,
            "ecode": "ONBOARD_BANK",
            "eby": "05d69885-9e9d-48e8-8673-3ba4d11fbf20",
            "started_at": "2025-03-19T09:26:33.000Z",
            "ischainable": False,
            "action_status": "PROCESSED"
        }
    ]
}

extracted_values = extract_values(test_json, "data.0.aid", "aid")
print(extracted_values)  # Should print {'aid': 1}