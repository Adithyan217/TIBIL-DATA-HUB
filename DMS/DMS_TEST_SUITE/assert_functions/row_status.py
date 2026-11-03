import logging
import pytest

# Set up logging
logger = logging.getLogger(__name__)


def assert_success_row_status(response, expected_response, expected_status, request):
    assert response.status_code == expected_status, (
        f"Expected status {expected_status}, got {response.status_code}"
    )

    try:
        response_json = response.json()

        steps = response_json.get("steps", [])
        data = response_json.get("data", {})

        for step in steps:
            if step not in data:
                pytest.fail(f"Step '{step}' not found in response data.")

            status_array = data[step]["hdetails"][0].get("status", [])
            if len(status_array) < 2:
                pytest.fail(f"Status array in step '{step}' does not have enough elements: {status_array}")

            total_rows, passed_rows = status_array[:2]
            if total_rows != passed_rows:
                pytest.fail(
                    f"Assertion Failed for '{step}': Not all rows passed. Total = {total_rows}, Passed = {passed_rows}"
                )

            logger.info(
                f"Assertion Passed for '{step}': All rows passed ({total_rows})."
            )

    except (KeyError, IndexError, TypeError) as e:
        pytest.fail(f"JSON Structure Error: {e}")


def assert_failed_row_status(response, expected_response, expected_status, request):
    assert response.status_code == expected_status, (
        f"Expected status {expected_status}, got {response.status_code}"
    )

    try:
        response_json = response.json()

        steps = response_json.get("steps", [])
        data = response_json.get("data", {})

        for step in steps:
            if step not in data:
                pytest.fail(f"Step '{step}' not found in response data.")

            status_array = data[step]["hdetails"][0].get("status", [])
            if len(status_array) < 2:
                pytest.fail(f"Status array in step '{step}' does not have enough elements: {status_array}")

            total_rows, passed_rows = status_array[:2]
            if total_rows == passed_rows:
                pytest.fail(
                    f"Assertion Failed for '{step}': Some or all rows passed. Total = {total_rows}, Passed = {passed_rows}"
                )

            logger.info(
                f"Assertion Passed for '{step}': Rows failed as expected. Total = {total_rows}, Passed = {passed_rows}"
            )

    except (KeyError, IndexError, TypeError) as e:
        pytest.fail(f"JSON Structure Error: {e}")
