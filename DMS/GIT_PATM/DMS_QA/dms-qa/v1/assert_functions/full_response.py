import json

def assert_full_response(response, expected_response, expected_status):
    # You might or might not use expected_status here.
    response_json = response.json()
    expected_json = json.loads(expected_response)
    assert response_json == expected_json, "Full response does not match expected response."
