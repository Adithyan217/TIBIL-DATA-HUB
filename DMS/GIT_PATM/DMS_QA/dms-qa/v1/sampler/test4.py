import os
import pytest
import requests
import json
import pandas as pd
from dotenv import load_dotenv
from Utilities import bearer, user_details

# Load environment variables from .env file
load_dotenv("Config/config.json")
BASE_URL = os.getenv("BASE_URL")
BEARER_TOKEN = bearer.get_token("bearer_token")
USER_ID = user_details.get_user_details("user_id")  # Retrieve USER_ID

# Load test cases from CSV
df = pd.read_csv("/home/adithyan/adithyan/DMS/DMS_TEST_SUITE/TestData/test_data2.csv")


# Context object to store values extracted from responses
class ContextObject:
    def __init__(self):
        self.store = {}

    def add(self, key, value):
        self.store[key] = value  # Replace existing value if key repeats

    def get(self, key):
        return self.store.get(key, None)


context = ContextObject()
context.add("user_id", USER_ID)  # Add USER_ID to context


@pytest.fixture(scope="module")
def test_executor():
    return context


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
    return values


def assert_response(assertion_type, response, expected_response, expected_status):
    """Performs different assertion checks based on assertion_type."""
    assert response.status_code == expected_status, f"Expected {expected_status}, got {response.status_code}"

    if assertion_type == "status_code":
        return  # Only checks status code

    response_json = response.json()
    expected_json = json.loads(expected_response)

    if assertion_type == "full_response":
        assert response_json == expected_json, "Response does not match expected response."

    elif assertion_type == "keys_and_types":
        for key in expected_json:
            assert key in response_json, f"Missing key: {key}"
            assert isinstance(response_json[key], type(expected_json[key])), f"Type mismatch for key: {key}"

    elif assertion_type == "keys_only":
        for key in expected_json:
            assert key in response_json, f"Missing key: {key}"


@pytest.mark.parametrize("index, row", df.iterrows())
def test_api_cases(test_executor, index, row):
    """Test API cases with dynamic placeholder replacement and response validation."""
    request_data = row['request']

    # if isinstance(request_data, str):
    #     for key in test_executor.store:
    #         value = test_executor.get(key)
    #         if value is not None:
    #             # Check if the value is a UUID or other string and quote it
    #             if isinstance(value, str) and not value.isdigit():
    #                 value = f'"{value}"'  # Wrap only strings in quotes
    #             request_data = request_data.replace(f"{{{key}}}", str(value))
    #         else:
    #             print(f"⚠️ Warning: Placeholder {{{key}}} has no value in context. Replacing with null.")
    #             request_data = request_data.replace(f"{{{key}}}", "null")  # Replace missing values with `null`

    for key in test_executor.store:
        value = test_executor.get(key)
        if value is not None:
            # If the value is NOT an integer, wrap it in quotes
            if not isinstance(value, int):
                value = f'"{value}"'  # Ensure non-integer values are quoted
            request_data = request_data.replace(f"{{{key}}}", str(value))
        else:
            print(f"⚠️ Warning: Placeholder {{{key}}} has no value in context. Replacing with null.")
            request_data = request_data.replace(f"{{{key}}}", "null")  # Replace missing values with `null`

    try:
        request_json = json.loads(request_data)  # Ensure request data is valid JSON
    except json.JSONDecodeError as e:
        pytest.fail(f"❌ Invalid JSON format after replacement:\n{request_data}\nError: {e}")

    # Make API request
    url = BASE_URL + row['endpoint']
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {BEARER_TOKEN}"}
    response = requests.request(row['request_type'], url, json=request_json, headers=headers)

    # Store values in context, replacing duplicates
    if isinstance(row['add_to_context_value'], str) and isinstance(row['add_to_context_key'], str):
        extracted_values = extract_values(response.json(), row['add_to_context_value'], row['add_to_context_key'])
        for key, value in extracted_values.items():
            test_executor.add(key, value)

    # Assertions
    assert_response(row['assertion_type'], response, row['response'], row['expected_status'])
    print(test_executor.store)