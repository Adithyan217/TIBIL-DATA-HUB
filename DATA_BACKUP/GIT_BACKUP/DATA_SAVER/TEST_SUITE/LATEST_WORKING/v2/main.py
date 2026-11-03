import argparse
import os
import pytest
from TestScript.scenario_manager import scenario_manager
from TestScript.generate_csv_reports import convert_json_to_csv


def main():
    parser = argparse.ArgumentParser(description="Run API test cases or scenarios")
    parser.add_argument("--mode", choices=["scenario", "testcase"], required=True,
                        help="Execution mode: scenario or testcase")
    args = parser.parse_args()

    if args.mode == "scenario":
        print("Running in SCENARIO mode")
        os.environ["TEST_MODE"] = "scenario"
        scenario_manager()
        # Run tests with HTML and JSON reporting
        pytest.main([
            "TestScript/test_cases.py",
            "--html-report=scenario_report.html",
            "-s"
        ])
    elif args.mode == "testcase":
        print("Running in TESTCASE mode")
        os.environ["TEST_MODE"] = "testcase"
        pytest.main([
            "TestScript/test_cases.py",
            "--html=test_report.html",
            "-s"
        ])

    print("Test reports generated: HTML and JSON.")

    json_report_file = "output.json"
    detailed_csv = "detailed_results.csv"
    scenario_csv = "scenario_results.csv"

    convert_json_to_csv(json_report_file, detailed_csv, scenario_csv)


if __name__ == "__main__":
    main()
