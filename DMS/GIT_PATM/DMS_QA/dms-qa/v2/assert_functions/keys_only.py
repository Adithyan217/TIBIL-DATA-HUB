import json

def assert_keys_only(response, expected_response, expected_status):
    response_json = response.json()
    expected_json = json.loads(expected_response)
    for key in expected_json.keys():
        assert key in response_json, f"Missing key: {key}"
