import json
import os
import logging
from Resuable.api_requests import make_request
from Resuable.assertion import assert_status_code
from Utilities import CustomLogger
from Utilities.readproperties import ReadConfig

# Get the log directory and CSV file path from the configuration
log_directory = ReadConfig.get_logs_directory()
log_file_path = os.path.join(log_directory, "API_Auth_Token.log")

# Set up the logger
logger = CustomLogger.setup_logger('API_Auth_Token_Log', log_file_path, level=logging.DEBUG)


# Function to get authorization token
def get_auth_token():
    # Get authorization details from configuration
    auth_url = ReadConfig.get_auth_url()
    auth_method = ReadConfig.get_auth_method()
    auth_headers = json.loads(ReadConfig.get_auth_headers())
    auth_payload = json.loads(ReadConfig.get_auth_payload())

    logger.info("***********************Authorization Request Made*****************************")
    response = make_request(auth_url, auth_method, auth_headers, auth_payload)
    assert_status_code(response, 200)
    logger.info("***********************Authorization Successful*****************************")

    if 'application/json' in response.headers.get('Content-Type', ''):
        response_data = response.json()
        logger.info("***********************Authorization Response Received*****************************")
        logger.info(f" access_token is {response_data['data']['access_token']}")
        return response_data['data']['access_token']
    else:
        logger.error("Authorization response is not in JSON format")
        return None
