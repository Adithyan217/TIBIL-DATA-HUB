import logging
import pytest

# Set up logging
logger = logging.getLogger(__name__)

def assert_onboarding_status(response, expected_response, expected_status):
    assert response.status_code == expected_status, (
        f"Expected status {expected_status}, got {response.status_code}"
    )

    try:
        response_json = response.json()

        # Get the first key dynamically (since name may change)
        data_key = next(iter(response_json["data"]))
        status_array = response_json["data"][data_key]["hdetails"][0]["status"]

        # Ensure status array has at least 2 elements (Total, Passed)
        if len(status_array) < 2:
            pytest.fail(f"❌ Status array does not have enough elements: {status_array}")

        total_rows, passed_rows = status_array[:2]  # Extract only total and passed counts

        # Ensure all rows have passed
        if total_rows != passed_rows:
            pytest.fail(
                f"❌ Assertion Failed for {data_key}: Not all rows passed. Total ({total_rows}) ≠ Passed ({passed_rows})"
            )

        logger.info(
            f"✅ Assertion Passed for {data_key}: All rows passed ({total_rows})."
        )

    except (KeyError, IndexError, TypeError) as e:
        pytest.fail(f"❌ JSON Structure Error: {e}")
