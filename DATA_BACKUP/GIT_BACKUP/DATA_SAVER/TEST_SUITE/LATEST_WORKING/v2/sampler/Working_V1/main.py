import argparse

import pytest

from TestScript.scenario_manager import scenario_manager
from TestScript.test_cases import run_all_test_cases

def main():
    parser = argparse.ArgumentParser(description="Run API test cases or scenarios")
    parser.add_argument("--mode", choices=["scenario", "testcase"], required=True, help="Execution mode: scenario or testcase")
    args = parser.parse_args()

    if args.mode == "scenario":
        print("Running in SCENARIO mode")
        scenario_manager()
    elif args.mode == "testcase":
        print("Running in TESTCASE mode")
        report_file = "test_report.html"
        pytest.main(["TestScript/test_cases.py", f"--html={report_file}"])

        print(f"Test report generated: {report_file}")


if __name__ == "__main__":
    main()
