import pytest
import json

def assert_data_limit(response, expected_response, expected_status,request):
    response_json = response.json()  # Convert response to JSON
    request_json = json.loads(request)  # Convert request body to JSON if it's a string


    expected_limit = request_json["pagination"]["limit"]  # Extract 'limit' from request
    actual_count = len(response_json.get("data", []))  # Count objects in 'data' array

    assert 0 < actual_count <= expected_limit, (
        f"❌ Expected data count to be between 1 and {expected_limit}, but got {actual_count}."
    )
