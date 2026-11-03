import os
import pytest
import requests
import json
import pandas as pd
from dotenv import load_dotenv
from Utilities import bearer, user_details
import jmespath
# Load environment variables
load_dotenv("Config/.env")
# load_dotenv("../Config/.env")
BASE_URL = os.getenv("BASE_URL")
USER_NAME = os.getenv("USER_NAME")
BEARER_TOKEN = bearer.get_token("bearer_token")
USER_ID = user_details.get_user_details("user_id")

# Load test cases
# df_tests = pd.read_csv("../TestData/test_cases.csv")
df_tests = pd.read_csv("TestData/test_cases.csv")


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

def extract_values(response_json, value_paths, context_keys):
    values = {}
    value_path_list = value_paths.split(",")    ## keys.split(",") turns "user.id,user.name" into ["user.id", "user.name"].
    context_key_list = context_keys.split(",")  #context_keys.split(",") turns "saved_user_id,saved_user_name" into ["saved_user_id", "saved_user_name"].

    for value_path, context_key in zip(value_path_list, context_key_list): #combaines the key values (key,value)
        value_path = value_path.strip()
        context_key = context_key.strip() #remove extra spaces
        value = jmespath.search(value_path, response_json)
        if value is not None:
            values[context_key] = value
    return values

def assert_response(assertion_type, response, expected_response, expected_status):
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

@pytest.mark.parametrize("index, row", df_tests.iterrows())
def test_api_cases(test_executor, index, row):
    request_data = row['request']
    to_replace = row.get('to_replace', None)

    if isinstance(to_replace, str) and to_replace.strip():
        for key in test_executor.store:
            value = test_executor.get(key)
            if value is not None:
                if isinstance(value, int):
                    value = str(value)
                elif f"[{{{key}}}]" in request_data:
                    value = f'"{value}"'
                else:
                    value = f'"{value}"'
                request_data = request_data.replace(f"{{{key}}}", str(value))

    request_json = None
    try:
        request_json = json.loads(request_data)
    except json.JSONDecodeError as e:
        pytest.fail(f"❌ Invalid JSON format after replacement:\n{request_data}\nError: {e}")

    url = BASE_URL + row['endpoint']
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {BEARER_TOKEN}"}
    response = requests.request(row['request_type'], url, json=request_json, headers=headers)

    if isinstance(row['add_to_context_value'], str) and isinstance(row['add_to_context_key'], str):
        extracted_values = extract_values(response.json(), row['add_to_context_value'], row['add_to_context_key'])
        for key, value in extracted_values.items():
            test_executor.add(key, value)
    # try:
        assert_response(row['assertion_type'], response, row['response'], row['expected_status'])

    # except AssertionError as e:
    #     print(f"Test Case {row['Test ID']} failed! | ERROR:{e}")
    #     return False
    # else:
    #     print(f"Test Case {row['Test ID']} success!")
    #     return True


def run_all_test_cases():
    for index, row in df_tests.iterrows():
        test_api_cases(context, index, row)
