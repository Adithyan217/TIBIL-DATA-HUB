import os
import pytest
import requests
import json
import pandas as pd
from dotenv import load_dotenv
from Utilities import bearer, user_details
import jmespath
from assert_functions.dispatcher import perform_assertion

# Load environment variables
load_dotenv("Config/.env")
BASE_URL = os.getenv("BASE_URL")
USER_NAME = os.getenv("USER_NAME")
BEARER_TOKEN = bearer.get_token("bearer_token")
USER_ID = user_details.get_user_details("user_id")

# Determine mode from environment variable (default to testcase mode)
mode = os.getenv("TEST_MODE", "testcase")

# Load test cases based on the mode
if mode == "scenario":
    # Load the merged CSV which contains the scenario ID and test case name
    df_tests = pd.read_csv("TestData/merged_tests.csv")
else:
    df_tests = pd.read_csv("TestData/test_cases.csv")

# Create custom test IDs based on mode
def get_test_id(row, mode):
    if mode == "scenario":
        # Combine scenario ID (assumed to be in column 'SID') with the test case name
        return f"S{row['SID']} - {row['Test ID']}"
    else:
        return row["Test ID"]

test_ids = [get_test_id(row, mode) for _, row in df_tests.iterrows()]

# Context object for dynamic variable replacement
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
    value_path_list = value_paths.split(",")
    context_key_list = context_keys.split(",")
    for value_path, context_key in zip(value_path_list, context_key_list):
        value_path = value_path.strip()
        context_key = context_key.strip()
        value = jmespath.search(value_path, response_json)
        if value is not None:
            values[context_key] = value
    return values

# Parameterize tests with custom IDs based on the mode
@pytest.mark.parametrize("index, row", df_tests.iterrows(), ids=test_ids)
def test_api_cases(test_executor, index, row):
    request_data = row['request']
    to_replace = row.get('to_replace_in_req', None)

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
    request_json=None
    try:
        request_json = json.loads(request_data)
    except json.JSONDecodeError as e:
        pytest.fail(f"❌ Invalid JSON format after replacement:\n{request_data}\nError: {e}")

    url = BASE_URL + row['endpoint']
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {BEARER_TOKEN}"}
    response = requests.request(row['request_type'], url, json=request_json, headers=headers)

    if isinstance(row['add_to_context_from_res'], str):
        extracted_values = extract_values(response.json(), row['add_to_context_from_res'], row['add_to_context_from_res'])
        for key, value in extracted_values.items():
            test_executor.add(key, value)

    perform_assertion(row['assertion_function'], response, row['response'], row['expected_status'])
    print(context.store)


# def run_all_test_cases():
#     for index, row in df_tests.iterrows():
#         test_api_cases(context, index, row)
