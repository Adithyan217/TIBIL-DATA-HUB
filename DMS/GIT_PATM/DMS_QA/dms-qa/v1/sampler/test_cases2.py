import os
import pytest
import requests
import json
import pandas as pd
from dotenv import load_dotenv
from Utilities import bearer, user_details

# Load environment variables
load_dotenv("Config/.env")

BASE_URL = os.getenv("BASE_URL")
USER_NAME = os.getenv("USER_NAME")
BEARER_TOKEN = bearer.get_token("bearer_token")
USER_ID = user_details.get_user_details("user_id")

# Context object
class ContextObject:
    def __init__(self):
        self.store = {}

    def add(self, key, value):
        self.store[key] = value

    def get(self, key):
        return self.store.get(key, None)

context = ContextObject()
context.add("user_id", USER_ID)
context.add("user_name", USER_NAME)

@pytest.fixture(scope="module")
def test_executor():
    return context

@pytest.fixture(scope="session")
def df_tests(request):
    csv_file = request.config.getoption("--csv")
    df=pd.read_csv(csv_file)
    return df

def extract_values(response_json, keys, context_keys):
    """ Extract values from API response based on keys provided in CSV. """
    values = {}
    key_list = keys.split(",") if isinstance(keys, str) else []
    context_key_list = context_keys.split(",") if isinstance(context_keys, str) else []

    for key, context_key in zip(key_list, context_key_list):
        key, context_key = key.strip(), context_key.strip()
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
    """ Compare API response with expected values. """
    assert response.status_code == expected_status, f"Expected {expected_status}, got {response.status_code}"

    if assertion_type == "status_code":
        return

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

@pytest.mark.parametrize("row", [None])  # Placeholder, will be replaced inside the test function
def test_api_cases(test_executor, df_tests, row):
    """ Run test cases dynamically based on CSV data. """
    for index, row in df_tests.iterrows():
        request_data = row['request']
        to_replace = row.get('to_replace', None)

        if isinstance(to_replace, str) and to_replace.strip():
            for key in test_executor.store:
                value = test_executor.get(key)
                if value is not None:
                    request_data = request_data.replace(f"{{{key}}}", str(value))
        request_json = None
        try:
            request_json = json.loads(request_data)
        except json.JSONDecodeError as e:
            pytest.fail(f"❌ Invalid JSON format:\n{request_data}\nError: {e}")

        url = BASE_URL + row['endpoint']
        headers = {"Content-Type": "application/json", "Authorization": f"Bearer {BEARER_TOKEN}"}
        response = requests.request(row['request_type'], url, json=request_json, headers=headers)

        if isinstance(row['add_to_context_value'], str) and isinstance(row['add_to_context_key'], str):
            extracted_values = extract_values(response.json(), row['add_to_context_value'], row['add_to_context_key'])
            for key, value in extracted_values.items():
                test_executor.add(key, value)

        assert_response(row['assertion_type'], response, row['response'], row['expected_status'])
        print(f"Test Case {row['Test ID']} PASSED")
