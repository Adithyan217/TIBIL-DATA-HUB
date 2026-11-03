import argparse
import importlib
import os
import pathlib

import pytest
from TestScript.scenario_manager import scenario_manager
from TestScript.generate_csv_reports import convert_json_to_csv

def get_report_filename(base_csv_path, suffix):
    base_name = pathlib.Path(base_csv_path).stem
    return f"{base_name}_{suffix}"


def main():
    parser = argparse.ArgumentParser(description="Run API test cases or scenarios")
    parser.add_argument("--mode", choices=["scenario", "testcase"], required=True,
                        help="Execution mode: scenario or testcase")

    parser.add_argument("--testcases-csvpath", required=True,
                        help="Path to test cases CSV file")
    parser.add_argument("--scenarios-csvpath",
                        help="Path to scenario CSV file (required for scenario mode)")
    parser.add_argument("--scenario-manager",
                        help="Path to the scenario manager function")
    #
    # parser.add_argument("--ms",
    #                     help="MS name")

    args = parser.parse_args()

    os.environ["TEST_CASES_PATH"] = args.testcases_csvpath
    report_filename = get_report_filename(args.testcases_csvpath, "report")




    if args.mode == "scenario":
        print("Running in SCENARIO mode")
        os.environ["TEST_MODE"] = "scenario"
        os.environ["SCENARIOS_PATH"] = args.scenarios_csvpath
        scenario_manager_function_path=args.scenario_manager
        module_name,function_name = scenario_manager_function_path.split(".",1)
        module = importlib.import_module("TestScript." + module_name)
        scenario_manager_function = getattr(module, function_name)
        scenario_manager_function()
        # Run tests with HTML and JSON reporting
        pytest.main([
            "TestScript/test_cases.py",
            f"--html-report=TestReports/{report_filename}.html",
            "-s"
        ])
    elif args.mode == "testcase":
        print("Running in TESTCASE mode")
        os.environ["TEST_MODE"] = "testcase"
        # os.environ["MS"]=args.ms
        pytest.main([
            "TestScript/test_cases.py",
            f"--html-report=TestReports/{report_filename}.html",
            "-s"
        ])

    print("Test reports generated: HTML and CSV.")


    json_report_file = "TestReports/output.json"
    detailed_csv = f"TestResult/{report_filename}_results.csv"
    scenario_csv = f"TestResult/{report_filename}_scenario_results.csv"
    suite_csv = f"TestResult/{report_filename}_suite_results.csv"

    convert_json_to_csv(json_report_file, detailed_csv, scenario_csv,suite_csv)
    # convert_json_to_csv(json_report_file, detailed_csv, scenario_csv)


if __name__ == "__main__":
    main()
