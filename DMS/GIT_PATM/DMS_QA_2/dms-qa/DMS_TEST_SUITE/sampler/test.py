import os
import pytest
import requests
import json
import pandas as pd
from dotenv import load_dotenv
from Utilities import bearer

# Load environment variables from .env file
load_dotenv("/home/adithyan/adithyan/DMS/DMS_TEST_SUITE/Config/.env")
# BEARER_TOKEN = os.getenv("BEARER_TOKEN")
BASE_URL = os.getenv("BASE_URL")
# print("baseurl"+BASE_URL)
BEARER_TOKEN = bearer.get_token("bearer_token")



# Load test cases from CSV
CSV_FILE = "/home/adithyan/adithyan/DMS/DMS_TEST_SUITE/TestData/Test_data.csv"
df = pd.read_csv(CSV_FILE)


@pytest.mark.parametrize("test_case", df.to_dict(orient="records"))
def test_api(test_case):
    url = BASE_URL + test_case["endpoint"]
    headers = json.loads(test_case["headers"]) if isinstance(test_case["headers"], str) else {}

    # Add Bearer Token from Config
    headers["Authorization"] = f"Bearer {BEARER_TOKEN}"

    payload = json.loads(test_case["payload"])
    expected_status = int(test_case["expected_status_code"])
    expected_keys = test_case["expected_response_keys"].split(",")

    # Make API request
    response = requests.request(
        method=test_case["method"],
        url=url,
        headers=headers,
        json=payload
    )

    # Assertions
    assert response.status_code == expected_status, f"Expected {expected_status}, got {response.status_code}"
    response_json = response.json()

    for key in expected_keys:
        assert key in response_json, f"Missing expected key: {key}"

    print(f"{test_case['Testcase ID']} {test_case['Testcase']} ")

pytest.main(["test.py", "-v", "--html=API_Functional_report.html"])