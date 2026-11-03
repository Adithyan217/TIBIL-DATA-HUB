import json

def assert_keys_and_types(response, expected_response, expected_status):
    response_json = response.json()
    expected_json = json.loads(expected_response)
    for key, expected_value in expected_json.items():
        assert key in response_json, f"Missing key: {key}"
        assert isinstance(response_json[key], type(expected_value)), f"Type mismatch for key: {key}"
