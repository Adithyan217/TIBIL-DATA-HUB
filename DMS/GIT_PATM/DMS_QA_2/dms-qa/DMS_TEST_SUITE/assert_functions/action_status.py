def assert_processed_action_status(response, expected_response, expected_status,request):

    # Ensure response has a valid status code
    assert response.status_code == expected_status, (
        f"Expected status {expected_status}, got {response.status_code}"
    )

    response_data = response.json()

    # Extract action_status
    # print("Full Response JSON:", response_data)
    actual_status = response_data["data"][0].get("action_status")
    assert actual_status == "PROCESSED", f"Expected 'PROCESSED', but got '{actual_status}'"

    # print("✅ Assertion Passed: action_status is 'PROCESSED'")


def assert_processing_action_status(response, expected_response, expected_status,request):

    # Ensure response has a valid status code
    assert response.status_code == expected_status, (
        f"Expected status {expected_status}, got {response.status_code}"
    )

    response_data = response.json()

    # Extract action_status
    # print("Full Response JSON:", response_data)
    actual_status = response_data["data"][0].get("action_status")
    assert actual_status == "PROCESSING", f"Expected 'PROCESSING', but got '{actual_status}'"

    # print("✅ Assertion Passed: action_status is 'PROCESSING'")
