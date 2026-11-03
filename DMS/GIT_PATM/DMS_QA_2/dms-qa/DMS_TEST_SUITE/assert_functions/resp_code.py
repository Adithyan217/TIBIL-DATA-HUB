
import pytest
import json

def assert_resp_code(response, expected_response, expected_status,request):
    response_json=response.json()
    expected_json = json.loads(expected_response)

    assert response_json['code'] == expected_json['code'], f"❌ Expected code {expected_json['code']}, but got {response_json['code']}."
    print(f"✅ Response code matches expected: {expected_json['code']}")
