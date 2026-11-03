import os

import pandas as pd


def scenario_manager():
    # Load test cases and scenario data
    test_cases_path = os.environ["TEST_CASES_PATH"]
    scenario_path = os.environ["SCENARIOS_PATH"]

    # Load test cases and scenario data
    df_tests = pd.read_csv(test_cases_path)
    df_scenarios = pd.read_csv(scenario_path)

    # Merge the test cases with scenario data (adjust keys as needed)
    # For example, assume "Test ID" in test cases corresponds to "TID" in scenarios
    merged_df = df_tests.merge(
        df_scenarios[['TID', 'SID', 'Order']],
        left_on='Test ID',
        right_on='TID',
        how='inner'
    )
    # Sort by the order defined in scenario.csv
    merged_df = merged_df.sort_values(by=['SID','Order'])

    # Write the merged DataFrame to a CSV that test_cases.py will load
    merged_df.to_csv("TestData/merged_tests.csv", index=False)
    print("Merged CSV for scenario mode generated.")


if __name__ == "__main__":
    scenario_manager()
