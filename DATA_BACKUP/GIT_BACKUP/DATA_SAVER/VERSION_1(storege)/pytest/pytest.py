import logging
import json
from Resuable.api_requests import make_request
from Resuable.assertion import assert_status_code, assert_response_keys, assert_response_body
from Utilities.readproperties import ReadConfig
from Resuable.auth_token import get_auth_token
from Utilities.CustomLogger import setup_logger

logger = setup_logger()

def handle_delete_request(method, post_url, post_payload):
    """
    Handle a DELETE request by making a POST request if the method is DELETE.
    :param method: The HTTP method to check.
    :param post_url: The URL for the POST request.
    :param post_payload: The payload for the POST request.
    :return: The response from the POST request or a message indicating no action taken.
    """
    if method.upper() == 'DELETE':
        logger.info(f"DELETE method detected. Making POST request to {post_url}.")
        
        # Get the authorization token if required
        auth_token = get_auth_token()
        
        # Make the POST request
        response = make_request(
            method='POST',
            url=post_url,
            headers={'Authorization': f'Bearer {auth_token}'},
            data=json.dumps(post_payload)
        )
        
        # Assert the status code and response structure if needed
        assert_status_code(response, 200)
        assert_response_keys(response, ['expected_key1', 'expected_key2'])
        assert_response_body(response, {'key': 'expected_value'})
        
        return response.json()
    else:
        logger.info("Request method is not DELETE. No POST request made.")
        return {"message": "No action taken for non-DELETE request."}

# Example usage
if __name__ == "__main__":
    request_method = 'DELETE'  # Simulating the request method
    post_url = ReadConfig.get_api_url('PostEndpoint')
    post_payload = {"example_key": "example_value"}

    response_data = handle_delete_request(request_method, post_url, post_payload)
    print(response_data)
