
def assert_status_code(response, expected_response, expected_status):
    # Here, expected_response can be ignored if not needed
    assert response.status_code == expected_status, f"Expected status code {expected_status}, got {response.status_code}"
