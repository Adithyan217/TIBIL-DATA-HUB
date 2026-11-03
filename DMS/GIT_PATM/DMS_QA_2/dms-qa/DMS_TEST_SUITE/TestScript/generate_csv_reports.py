import json
import csv
import re
from collections import defaultdict



def convert_json_to_csv(json_file, detailed_csv, scenario_csv, suite_level_csv):
    
    with open(json_file, "r") as f:
        data = json.load(f)

    test_cases = []
    scenario_results = defaultdict(lambda: {"status": "PASS", "failed_tests": []})

    # Extract test cases from JSON report
    suites = data.get("content", {}).get("suites", {})
    suite_name = data.get("content", {}).get("suites", {}).get("0", {}).get("suite_name", "N/A")

    for suite in suites.values():
        for test in suite.get("tests", {}).values():
            full_test_name = test.get("test_name", "N/A")
            status = test.get("status", "N/A").upper()
            error_msg = test.get("message", "").strip()

            # Extract Scenario ID and Test ID using regex
            match = re.search(r'\[(S\d+)\s*-\s*(T\w+)\]', full_test_name)
            if match:
                scenario = match.group(1)  # e.g., S1
                test_id = match.group(2)  # e.g., T1
            else:
                scenario = "N/A"
                test_id = "N/A"

            # Store detailed test case results
            test_cases.append([full_test_name, scenario, status, error_msg])

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
        writer.writerow(["Test Case", "Scenario", "Status", "Error Message"])
        writer.writerows(test_cases)

    # Write Scenario-Level Summary (Ensure all scenarios are included)
    with open(scenario_csv, "w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["Scenario", "Status", "Failed Test Cases"])
        for scenario, result in scenario_results.items():
            failed_tests_str = ", ".join(result["failed_tests"]) if result["failed_tests"] else "-"
            writer.writerow([scenario, result["status"], failed_tests_str])

    # Generate Suite-Level Summary
    total_scenarios = len(scenario_results)
    passed_scenarios = sum(1 for result in scenario_results.values() if result["status"] == "PASS")
    failed_scenarios = total_scenarios - passed_scenarios
    total_test_cases = len(test_cases)
    passed_test_cases = sum(1 for case in test_cases if case[2] == "PASS")
    failed_test_cases = total_test_cases - passed_test_cases

    # Write Suite-Level CSV
    with open(suite_level_csv, "w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["Suite Name", "Total Scenarios", "Passed Scenarios", "Failed Scenarios",
                         "Total Test Cases", "Passed Test Cases", "Failed Test Cases"])
        writer.writerow([suite_name, total_scenarios, passed_scenarios, failed_scenarios,
                         total_test_cases, passed_test_cases, failed_test_cases])


