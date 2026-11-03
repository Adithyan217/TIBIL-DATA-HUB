import logging

logger = logging.getLogger('API_TEST_LOG')


def assert_status_code(response, expected_status_code=200):
    try:
        assert response.status_code == expected_status_code, f"Failure: Expected status code {expected_status_code}, but received {response.status_code}"
        logger.info(f"Success: Status code is {response.status_code} as expected.")
    except AssertionError as e:
        logger.error(str(e))

        raise


def assert_response_keys(response_data, expected_keys):
    response_keys = response_data.keys()
    try:
        for key in expected_keys:
            assert key in response_keys, f"Failure: Expected key '{key}' not found in response."
        logger.info(f"Success: All expected keys {expected_keys} found in response.")
    except AssertionError as e:
        logger.error(str(e))
        raise


def assert_response_body(response, expected_response):
    actual_response = response.json()
    missing_pairs = {}

    for key, expected_value in expected_response.items():
        actual_value = actual_response.get(key)
        if actual_value != expected_value:
            missing_pairs[key] = (expected_value, actual_value)

    if not missing_pairs:
        logger.info("Success: Expected key-value pairs are present in the actual response.")
    else:
        error_message = "Failure: The following key-value pairs are missing or incorrect in the actual response: "
        for key, (expected_value, actual_value) in missing_pairs.items():
            error_message += f"\n- Key: {key}, Expected: {expected_value}, Got: {actual_value}"
        logger.error(error_message)
        raise AssertionError(error_message)
