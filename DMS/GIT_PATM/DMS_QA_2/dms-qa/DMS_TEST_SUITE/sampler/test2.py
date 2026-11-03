import csv
import json
import os

import pytest
import requests
import jmespath
from dotenv import load_dotenv
from Utilities import bearer

# Load environment variables from .env file
load_dotenv("Config/config.json")
# BEARER_TOKEN = os.getenv("BEARER_TOKEN")
BASE_URL = os.getenv("BASE_URL")
BEARER_TOKEN = bearer.get_token("bearer_token")


# Predefined values (e.g., UserId from an external source)
predefined_values = {
    "UserId": ""
}


def read_test_cases(csv_file):
    """Reads test cases from CSV and returns structured data."""
    test_cases = {}
    with open(csv_file, mode="r") as file:
        reader = csv.DictReader(file)
        for row in reader:
            scenario_id = row["Scenario ID"]
            test_id = row["Test ID"]
            if scenario_id not in test_cases:
                test_cases[scenario_id] = []
            test_cases[scenario_id].append({
                "test_id": test_id,
                "request_type": row["request_type"],
                "endpoint": row["endpoint"],
                "payload": json.loads(row["payload"]) if row["payload"] else {},
                "expected_status": int(float(row["expected_status"])) if row["expected_status"] else None,
                "depends_on": row["depends_on"].strip() if row["depends_on"] else None,
                "replacer": row["replacer"].split(",") if row["replacer"] else [],
                "dependent_value_path": row["dependent_value_path"].split(",") if row["dependent_value_path"] else []
            })
    return test_cases


@pytest.fixture(scope="session")
def execute_test_session():
    csv_file = "test_cases.csv"
    test_sessions = read_test_cases(csv_file)

    results = {}

    def run_session(scenario_id):
        """Executes test steps for a given scenario."""
        session_data = test_sessions.get(scenario_id, [])
        result_store = {}  # Store all previous responses

        for step in session_data:
            url = f"{BASE_URL}{step['endpoint']}"
            payload = step["payload"]
            headers = {"Content-Type": "application/json", "Authorization": f"Bearer {BEARER_TOKEN}"}

            # Replace placeholders dynamically using result_store or predefined_values
            for replacer_key in step["replacer"]:
                if replacer_key in predefined_values:
                    payload = json.loads(
                        json.dumps(payload).replace(f"{{{replacer_key}}}", predefined_values[replacer_key]))
                else:
                    index = step["replacer"].index(replacer_key) if replacer_key in step["replacer"] else None
                    if index is not None and index < len(step["dependent_value_path"]):
                        path = step["dependent_value_path"][index]
                        extracted_value = jmespath.search(path, result_store)
                        if extracted_value:
                            result_store[path] = extracted_value
                            payload = json.loads(
                                json.dumps(payload).replace(f"{{{replacer_key}}}", str(extracted_value)))

            # Perform API request
            response = requests.request(
                method=step["request_type"],
                url=url,
                json=payload if step["request_type"] in ["POST", "PUT"] else None,
                headers=headers
            )

            # Store response
            response_data = response.json()
            result_store.update(response_data)

            # Assert response status
            if step["expected_status"]:
                assert response.status_code == step["expected_status"], f"Test {step['test_id']} failed!"

        results[scenario_id] = result_store
        return result_store

    return run_session  # Returns function for dynamic execution


def test_user_session(execute_test_session):
    """Runs a complete test session with dependent API calls."""
    scenario_id = "S1"  # Can be parameterized
    session_results = execute_test_session(scenario_id)
    assert session_results, "Session execution failed!"