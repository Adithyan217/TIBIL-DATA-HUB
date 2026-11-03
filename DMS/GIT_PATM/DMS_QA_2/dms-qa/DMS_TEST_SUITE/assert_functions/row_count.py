def assert_row_count(response, expected_response, expected_status, request):
    # Ensure status code is as expected
    assert response.status_code == expected_status, f"Expected status code {expected_status}, got {response.status_code}"

    # Parse the response JSON
    res_json = response.json()

    # Check that 'data' exists and is a non-empty list
    assert isinstance(res_json.get("data"), list), "'data' should be a list"
    assert len(res_json["data"]) > 0, "Expected at least one item in 'data', but got empty list"
