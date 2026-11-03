import pandas as pd
import pytest
import os

from TestScript.test_cases import test_api_cases

df_tests = pd.read_csv("TestData/test_cases.csv")
df_scenarios = pd.read_csv("TestData/scenario.csv")

def scenario_manager():
    overall_success = True
    df_scenarios_unique = df_scenarios['SID'].unique()

    for scenario_id in df_scenarios_unique:
        # Get test cases for this scenario
        scenario_cases = df_scenarios[df_scenarios['SID'] == scenario_id]
        test_cases = df_tests[df_tests['Test ID'].isin(scenario_cases['TID'])]

        # Save scenario-specific test cases to a temp CSV file
        temp_csv = f"TestData/temp_scenario_{scenario_id}.csv"
        test_cases.to_csv(temp_csv, index=False)

        print(f"\n🔹 Executing Scenario ID: {scenario_id}")

        # Run pytest for this scenario
        result = pytest.main(["TestScript/test_cases.py", f"--csv={temp_csv}"])

        if result != 0:
            overall_success = False
            print(f"Scenario {scenario_id} FAILED")
        else:
            print(f"Scenario {scenario_id} PASSED")

        # Cleanup temp file
        os.remove(temp_csv)

    if overall_success:
        print("\nAll scenarios PASSED!")
    else:
        print("\nSome scenarios FAILED!")

