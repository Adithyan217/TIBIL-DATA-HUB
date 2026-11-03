import argparse
from sampler.scenario_manager2 import scenario_manager
import pytest

def main():
    parser = argparse.ArgumentParser(description="Run API test cases or scenarios")
    parser.add_argument("--mode", choices=["scenario", "testcase"], required=True, help="Execution mode: scenario or testcase")
    args = parser.parse_args()

    if args.mode == "scenario":
        print("\nRunning in SCENARIO mode")
        scenario_manager()
    elif args.mode == "testcase":
        print("\nRunning in TESTCASE mode")
        pytest.main(["TestScript/test_cases2.py", "--csv=TestData/test_data2.csv"])


if __name__ == "__main__":
    main()
