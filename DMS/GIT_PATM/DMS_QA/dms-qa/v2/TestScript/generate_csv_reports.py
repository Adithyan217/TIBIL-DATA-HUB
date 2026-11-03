import json
import csv
import re
from collections import defaultdict

def convert_json_to_csv(json_file, detailed_csv, scenario_csv):
    with open(json_file, "r") as f:
        data = json.load(f)

    test_cases = []
    scenario_results = defaultdict(lambda: {"status": "PASS", "failed_tests": []})

    # Extract test cases from JSON report
    suites = data.get("content", {}).get("suites", {})
    for suite in suites.values():
        for test in suite.get("tests", {}).values():
            full_test_name = test.get("test_name", "N/A")
            status = test.get("status", "N/A").upper()
            error_msg = test.get("message", "").strip()

            # Extract Scenario ID and Test ID using regex
            match = re.search(r'\[(S\d+)\s*-\s*(T\d+)\]', full_test_name)
            if match:
                scenario = match.group(1)  # e.g., S1
                test_id = match.group(2)   # e.g., T1
            else:
                scenario = "N/A"
                test_id = "N/A"

            # Store detailed test case results
            test_cases.append([full_test_name, status, error_msg])

            # Ensure scenario exists in the dictionary
            if scenario not in scenario_results:
                scenario_results[scenario] = {"status": "PASS", "failed_tests": []}

            # Update scenario-level status
            if status != "PASS":
                scenario_results[scenario]["status"] = "FAIL"
                scenario_results[scenario]["failed_tests"].append(test_id)

    # Write Detailed Test Case Results
    with open(detailed_csv, "w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["Test Case", "Scenario", "Error Message"])
        writer.writerows(test_cases)

    # Write Scenario-Level Summary (Ensure all scenarios are included)
    with open(scenario_csv, "w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["Scenario", "Status", "Failed Test Cases"])
        for scenario, result in scenario_results.items():
            failed_tests_str = ", ".join(result["failed_tests"]) if result["failed_tests"] else "-"
            writer.writerow([scenario, result["status"], failed_tests_str])

# Example usage:
convert_json_to_csv("output.json", "detailed_results.csv", "scenario_results.csv")
