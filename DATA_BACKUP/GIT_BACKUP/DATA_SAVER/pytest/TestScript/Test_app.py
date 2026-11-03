import os
import logging
import pytest
import json
import requests
from Resuable.api_requests import make_request
from Resuable.assertion import assert_status_code, assert_response_keys, assert_response_body
from Utilities.readproperties import ReadConfig
from Resuable.auth_token import get_auth_token
from Utilities.CustomLogger import setup_logger

# Get the log directory and CSV file path from the configuration
log_directory = ReadConfig.get_logs_directory()
log_file_path = os.path.join(log_directory, "API_TEST.log")

# Set up the logger
logger = setup_logger('API_TEST_LOG', log_file_path, level=logging.DEBUG)

if logger is None:
    raise SystemExit("Logger setup failed. Exiting...")

# Get the CSV file path from the configuration
csv_file_path = ReadConfig.get_csv_file_path()

# Read the CSV data
csv_data = ReadConfig.read_csv(csv_file_path)

# Extract test case IDs for custom test names
test_params = [pytest.param(data, id=data['Testcase ID']) for data in csv_data]

# Get the authorization token
# auth_token = get_auth_token()

# expired_token = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJvSS14anVfTDRQSm"

# Get the base URL from configuration
base_url = ReadConfig.get_base_url()


@pytest.mark.parametrize("test_data", test_params)
def test_api(test_data):
    # global url
    endpoint = test_data['endpoint']
    method = test_data['method']
    headers = json.loads(test_data['headers']) if test_data['headers'] else {}
    payload = json.loads(test_data['payload']) if test_data['payload'] else {}
    query_params = json.loads(test_data['params']) if test_data['params'] else {}
    expected_status_code = int(test_data['expected_status_code'])
    expected_keys = test_data['expected_response_keys'].split(',') if test_data['expected_response_keys'] else None
    expected_response = json.loads(test_data['expected_responce_body']) if test_data['expected_responce_body'] else None
    # auth_required = test_data['auth_required'].lower() == 'true'
    # expired_token = test_data.get('expired_token', 'false').lower() == 'true'

    # if method == 'Delete':
    #     if endpoint == '/starred-questions/pid':
    #         spayload = {"user_id": "2", "org_id": 4, "question": "what are the top one products by sales?"}
    #         result = requests.post(f'{base_url}/starred-questions', json=spayload)
    #         if result.status_code == 201:
    #             pid = result.json().get('pid', '')
    #             url = f"{base_url}/starred-questions/{pid}"
    #         else:
    #             pytest.fail(f"Failed to create starred question: {result.status_code} {result.text}")
    #
    #     if endpoint == '/conversations':
    #         result = requests.get(f'{base_url}/conversations', params=query_params)
    #         if result.ok and result.json().get('data'):
    #             cid = result.json()['data'][0].get('conversation_id', '')
    #             query_params["conversation_id"] = cid
    #             url = f"{base_url}{endpoint}"
    #         else:
    #             pytest.fail(f"Failed to retrieve conversations: {result.status_code} {result.text}")
    #     else:
    #         url = f"{base_url}{endpoint}"
    # else:
    url = f"{base_url}{endpoint}"




    # Add authorization token to headers if required
    # if auth_required:
    #     use_token = expired_token if expired_token else auth_token
    #     headers['Authorization'] = f'Bearer {use_token}'

    logger.info("***********************API Test Start*****************************")
    logger.info("***********************API Request Made*****************************")
    response = make_request(url, method, headers, payload, params=query_params)

    if 'application/json' in response.headers.get('Content-Type', ''):
        response_data = response.json()
        logger.info("*********************** Response Received *****************************")
    else:
        response_data = None
        logger.info("*********************** Response is not in JSON format *****************************")
        logger.info(response.text)

    assert_status_code(response, expected_status_code)
    logger.info("*********************** Status Code Asserted *****************************")

    if expected_keys and response_data:
        assert_response_keys(response_data, expected_keys)
        logger.info("***********************Response Keys Asserted*****************************")

    if expected_response and response_data:
        assert_response_body(response, expected_response)
        logger.info("***********************Response Body Asserted*****************************")

    logger.info("***********************API Test Ends*****************************")

pytest.main(["Test_app.py", "-v", "--html=API_Functional_report.html"])